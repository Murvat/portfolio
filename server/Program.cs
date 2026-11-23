using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.RateLimiting;

var builder = WebApplication.CreateBuilder(args);
var storagePath = Path.GetFullPath(builder.Configuration["Portfolio:DataPath"]
    ?? Path.Combine(builder.Environment.ContentRootPath, "data"));
Directory.CreateDirectory(storagePath);
var adminPassword = builder.Configuration["Portfolio:AdminPassword"];
if (adminPassword is not null && (adminPassword.Length is < 16 or > 1024))
    throw new InvalidOperationException("The portfolio admin password must contain 16 to 1024 characters.");

var cookieSecurity = builder.Environment.IsDevelopment()
    ? CookieSecurePolicy.SameAsRequest : CookieSecurePolicy.Always;
builder.WebHost.ConfigureKestrel(options => options.Limits.MaxRequestBodySize = 512 * 1024);
builder.Services.AddSingleton(new PortfolioStore(storagePath));
builder.Services.AddDataProtection().SetApplicationName("Portfolio").PersistKeysToFileSystem(
    Directory.CreateDirectory(Path.Combine(storagePath, "keys")));
builder.Services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme).AddCookie(options =>
{
    options.Cookie.Name = "portfolio-admin";
    options.Cookie.HttpOnly = true;
    options.Cookie.SecurePolicy = cookieSecurity;
    options.Cookie.SameSite = SameSiteMode.Strict;
    options.ExpireTimeSpan = TimeSpan.FromHours(4);
    options.SlidingExpiration = false;
    options.Events.OnRedirectToLogin = context => { context.Response.StatusCode = 401; return Task.CompletedTask; };
    options.Events.OnRedirectToAccessDenied = context => { context.Response.StatusCode = 403; return Task.CompletedTask; };
    options.Events.OnValidatePrincipal = async context =>
    {
        var expected = PasswordVersion(adminPassword);
        if (expected is null || context.Principal?.FindFirstValue("password_version") != expected)
        {
            context.RejectPrincipal();
            await context.HttpContext.SignOutAsync();
        }
    };
});
builder.Services.AddAuthorizationBuilder().AddPolicy("PortfolioAdmin", policy => policy.RequireRole("Admin"));
builder.Services.AddAntiforgery(options =>
{
    options.HeaderName = "X-CSRF-Token";
    options.Cookie.HttpOnly = true;
    options.Cookie.SecurePolicy = cookieSecurity;
    options.Cookie.SameSite = SameSiteMode.Strict;
});
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.AddFixedWindowLimiter("admin-login", limit =>
    {
        limit.PermitLimit = 10;
        limit.Window = TimeSpan.FromMinutes(1);
        limit.QueueLimit = 0;
        limit.AutoReplenishment = true;
    });
});

var app = builder.Build();
if (!app.Environment.IsDevelopment()) app.UseHsts();
app.UseDefaultFiles();
app.UseStaticFiles();
app.UseRouting();
app.UseAuthentication();
app.UseAuthorization();
app.UseRateLimiter();

var api = app.MapGroup("/api");
api.AddEndpointFilter(async (context, next) =>
{
    context.HttpContext.Response.Headers.CacheControl = "no-store";
    return await next(context);
});

api.MapGet("/portfolio", (PortfolioStore store) => Results.Ok(store.Read()));
api.MapGet("/admin/session", (HttpContext context, IAntiforgery antiforgery) => Results.Ok(new
{
    enabled = adminPassword is not null,
    isAdmin = context.User.IsInRole("Admin"),
    csrfToken = antiforgery.GetAndStoreTokens(context).RequestToken,
}));

api.MapPost("/admin/login", async (Login body, HttpContext context, IAntiforgery antiforgery) =>
{
    if (!await antiforgery.IsRequestValidAsync(context)) return Results.BadRequest();
    if (adminPassword is null) return Results.StatusCode(503);
    if (body.Password is null || body.Password.Length > 1024 ||
        !CryptographicOperations.FixedTimeEquals(Hash(body.Password), Hash(adminPassword)))
        return Results.Unauthorized();

    var identity = new ClaimsIdentity([
        new Claim(ClaimTypes.NameIdentifier, "portfolio-admin"),
        new Claim(ClaimTypes.Role, "Admin"),
        new Claim("password_version", PasswordVersion(adminPassword)!)
    ], CookieAuthenticationDefaults.AuthenticationScheme);
    await context.SignInAsync(new ClaimsPrincipal(identity));
    return Results.NoContent();
}).RequireRateLimiting("admin-login");

api.MapPost("/admin/logout", async (HttpContext context, IAntiforgery antiforgery) =>
{
    if (!await antiforgery.IsRequestValidAsync(context)) return Results.BadRequest();
    await context.SignOutAsync();
    return Results.NoContent();
}).RequireAuthorization("PortfolioAdmin");

api.MapPut("/portfolio", async (PortfolioSnapshot request, PortfolioStore store, HttpContext context, IAntiforgery antiforgery) =>
{
    if (!await antiforgery.IsRequestValidAsync(context)) return Results.BadRequest();
    if (!PortfolioStore.IsValid(request.Content)) return Results.BadRequest(new { message = "Check the portfolio fields and links." });
    var saved = store.Publish(request);
    return saved is null
        ? Results.Conflict(new { message = "The portfolio changed elsewhere. Reload the page before publishing." })
        : Results.Ok(saved);
}).RequireAuthorization("PortfolioAdmin");

app.Run();

static byte[] Hash(string value) => SHA256.HashData(Encoding.UTF8.GetBytes(value));
static string? PasswordVersion(string? value) => value is null ? null : Convert.ToHexString(Hash(value));

record Login(string? Password);

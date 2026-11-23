using System.Text.Json;
using System.Text.RegularExpressions;

record PortfolioSnapshot(long Revision, JsonElement? Content);

sealed class PortfolioStore(string directory)
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);
    private static readonly string[] TimelineFields = ["id", "title", "organization", "dates", "description", "url"];
    private static readonly Dictionary<string, (string[] Allowed, string[] Required)> Sections = new()
    {
        ["education"] = (TimelineFields, ["title"]),
        ["certificates"] = (TimelineFields, ["title"]),
        ["experience"] = (TimelineFields, ["title"]),
        ["articles"] = (TimelineFields, ["title"]),
        ["projects"] = (["id", "title", "description", "contribution", "url"], ["title"]),
        ["passions"] = (["id", "text"], ["text"]),
        ["books"] = (["id", "title", "author", "category", "note"], ["id", "title", "author"]),
    };

    private readonly object gate = new();
    private readonly string path = Path.Combine(directory, "portfolio.json");

    public PortfolioSnapshot Read()
    {
        lock (gate)
        {
            if (!File.Exists(path)) return new(0, null);
            return JsonSerializer.Deserialize<PortfolioSnapshot>(File.ReadAllBytes(path), JsonOptions)
                ?? throw new InvalidDataException("The portfolio data file is invalid.");
        }
    }

    public PortfolioSnapshot? Publish(PortfolioSnapshot update)
    {
        lock (gate)
        {
            if (Read().Revision != update.Revision) return null;
            var published = update with { Revision = update.Revision + 1 };
            var temporaryPath = path + ".tmp";
            File.WriteAllBytes(temporaryPath, JsonSerializer.SerializeToUtf8Bytes(published, JsonOptions));
            File.Move(temporaryPath, path, overwrite: true);
            return published;
        }
    }

    public static bool IsValid(JsonElement? value)
    {
        if (value is not { ValueKind: JsonValueKind.Object } content) return false;
        if (!content.TryGetProperty("about", out var about) ||
            !ValidFields(about, ["name", "summary"], ["name", "summary"], allowEmpty: true)) return false;
        if (content.EnumerateObject().Count() != Sections.Count + 1) return false;

        foreach (var (name, (allowed, required)) in Sections)
        {
            if (!content.TryGetProperty(name, out var entries)) return false;
            if (name == "books" && entries.ValueKind == JsonValueKind.Null) continue;
            if (entries.ValueKind != JsonValueKind.Array || entries.GetArrayLength() > 500) return false;
            var ids = new HashSet<string>();
            foreach (var entry in entries.EnumerateArray())
            {
                if (!ValidFields(entry, allowed, required)) return false;
                if (entry.TryGetProperty("id", out var id) && !ids.Add(id.GetString()!)) return false;
            }
        }
        return true;
    }

    private static bool ValidFields(JsonElement entry, string[] allowed, string[] required, bool allowEmpty = false)
    {
        if (entry.ValueKind != JsonValueKind.Object) return false;
        var names = new HashSet<string>();
        foreach (var field in entry.EnumerateObject())
        {
            if (!names.Add(field.Name) || !allowed.Contains(field.Name) || field.Value.ValueKind != JsonValueKind.String) return false;
            var text = field.Value.GetString()!;
            if (text.Length > 8000) return false;
            if (field.Name == "url" && text.Length != 0 &&
                !Regex.IsMatch(text, @"\A#[a-zA-Z0-9_-]+\z") &&
                !(Uri.TryCreate(text, UriKind.Absolute, out var uri) && uri.Scheme is "http" or "https" && uri.Host.Length > 0))
                return false;
        }
        return required.All(name => entry.TryGetProperty(name, out var field) &&
            (allowEmpty || !string.IsNullOrWhiteSpace(field.GetString())));
    }
}

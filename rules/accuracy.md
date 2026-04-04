# Accuracy

## Verification before reference
* Never reference a file path, class, method, function, type, database table, column, or API endpoint without first verifying it exists via search or file read in the current session. Prior session knowledge is not reliable.
* Never assume a library, package, or framework feature is available. Check the actual dependency files (package.json, composer.json, *.csproj, requirements.txt, go.mod, Cargo.toml, or equivalent) before using any import or API.
* When referencing a dependency, check the installed version. Framework behavior changes across versions -- do not assume the latest docs apply.

## When uncertain
* If you cannot verify something, say so explicitly rather than presenting a guess as fact. Use phrasing like "could not verify" or "unconfirmed" -- never silently assume.
* When the cost of being wrong is high (data models, auth, deletion, public APIs), stop and ask rather than guessing. When the cost is low (variable naming, log messages, internal formatting), use your best judgment and note the assumption.
* Do not fill knowledge gaps with plausible-sounding guesses. An explicit "I don't know" or "I could not find this" is always preferable to a confident fabrication.

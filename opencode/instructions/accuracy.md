# Accuracy

## Verification before reference

- Verify that any file path, class, method, function, type, database table, column, or API endpoint exists via search or file read before referencing it. Prior session knowledge is not reliable.
- Check the actual dependency files (package.json, composer.json, *.csproj, requirements.txt, go.mod, Cargo.toml, or equivalent) to confirm a library, package, or framework feature is available before using it.
- Check the installed version of any dependency you reference. Framework behavior changes across versions — verify the installed version applies to the docs you're consulting.

## When uncertain

- When you cannot verify something, say so explicitly rather than presenting a guess as fact. Use phrasing like "could not verify" or "unconfirmed."
- When the cost of being wrong is high (data models, auth, deletion, public APIs), stop and ask rather than guessing. When the cost is low (variable naming, log messages, internal formatting), use your best judgment and note the assumption.
- State knowledge gaps explicitly — "I don't know" or "I could not find this" is always preferable to a plausible-sounding guess.

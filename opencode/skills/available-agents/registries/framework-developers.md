# Framework developers

Framework-specific implementation. Each layers on top of the matching language-developer for language-level concerns; chain the language reviewer afterward.

| Agent | Purpose | When to invoke |
|-------|---------|----------------|
| react-developer | React / Next.js / Remix implementation | Components, hooks, or framework-specific work. Layers on `typescript-developer`; pair with `typescript-reviewer` afterward. |
| efcore-developer | Entity Framework Core implementation | EF Core entities, migrations, queries. Layers on `csharp-developer`; pair with `csharp-reviewer` afterward. |
| doctrine-developer | Doctrine ORM implementation | Entities, DQL, repositories, migrations. Layers on `php-developer`; pair with `php-reviewer` afterward. |
| laminas-developer | Laminas / Mezzio implementation | Laminas MVC or Mezzio modules, middleware, forms. Layers on `php-developer`; pair with `php-reviewer` afterward. |

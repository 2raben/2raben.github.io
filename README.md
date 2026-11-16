# 2raben.github.io

The website of our hobby game studio. It links the games programmed at the
Nationaler Zukunftstag:

| Game | Play | Source |
| --- | --- | --- |
| Moto Devil: a stunt-bike game whose levels lie to you | <https://2raben.github.io/moto-devil/> | [2raben/moto-devil](https://github.com/2raben/moto-devil) |
| Car Drive: a three-lane arcade driver through traffic | <https://2raben.github.io/carrrgh/> | [2raben/carrrgh](https://github.com/2raben/carrrgh) |

The games are built and deployed from their own repositories; this site only
links to them. The studio's name is not chosen yet ("2raben" is temporary), so the
site holds one complete version per name candidate: `/schafbock-studio/`,
`/egg-settlers/`, `/november-games/`, `/waldstatt-games/` and `/2raben-games/`, each
with a home page, an about page and a page per game. The page at `/` lists them all.

It is a static site built with [Astro](https://astro.build) and
[daisyUI](https://daisyui.com), in German, and published on GitHub Pages at
<https://2raben.github.io/>.

## Run it locally

With [mise](https://mise.jdx.dev):

```sh
mise install && mise run install
mise run dev    # http://localhost:4321
```

## Documentation

- [CONTRIBUTING.md](CONTRIBUTING.md): how to shape, build, and submit changes.
- [AGENTS.md](AGENTS.md): instructions for AI coding agents.
- [Architecture](docs/architecture/README.md) and [decisions](docs/architecture/decisions/README.md).
- [Idea](docs/idea.md): project direction.
- [Pitches](docs/pitches/README.md): proposed features.

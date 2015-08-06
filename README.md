# detectivegit

Detective git takes a look at your repository and shows you
where your hotspots and possible bugs are.

![Screenshot of Flinter](screenshot.png)

## How it works

### Hotspots

Detecting hotspots is just some bash hackery:

```bash
git log --pretty=format: --name-only | sort | uniq -c | sort -rg | head -n 10'
```

### Bug prediction

Using [igrigorik/bugspots](https://github.com/igrigorik/bugspots) to guess
where bugs might occur (based on [Google's bug prediction heuristic](http://google-engtools.blogspot.ch/2011/12/bug-prediction-at-google.html)).

```
bugspots .
```

## Todos

- [ ] Store analysis in database (2h)
- [ ] Support sharing the link `/sebubu/bringtoafrica` which will fetch from either the database or run a new analysis (3h)
- [ ] Limit number of rows and allow expanding (1h)
- [ ] Show help box for the heuristics (1h)

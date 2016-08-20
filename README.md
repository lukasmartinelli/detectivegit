# detectivegit

Detective git takes a look at your repository and shows you
where your hotspots and possible bugs are.

[**:globe_with_meridians: Check the demo at detectivegit.lukasmartinelli.ch**](http://detectivegit.lukasmartinelli.ch)

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

## Docker

In order to run detectivegit you need `git`, `cpd` and `bugspots`.
Because these tools require a complex stack consisting of `Node`, `Ruby` and `Java`
we need Docker to ensure a working environment.

Build image.

```
docker build -t lukasmartinelli/detectivegit
```

Run image.

```
docker run --rm -p 3000:3000 -t lukasmartinelli/detectivegit
```

Develop with image.
```
docker run --rm -v $(pwd):/usr/src/app -p 3000:3000 -t lukasmartinelli/detectivegit
```

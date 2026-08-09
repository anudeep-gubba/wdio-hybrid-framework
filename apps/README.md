# apps/

Drop native app builds here — `.apk` (Android), `.app`/`.ipa` (iOS) — then point
`ANDROID_APP_PATH`/`IOS_APP_PATH` at just the **filename** in `config/environments/<env>.env`, e.g.:

```
ANDROID_APP_PATH=myapp-debug.apk
IOS_APP_PATH=MyApp.app
```

`config/envLoader.ts`'s `resolveAppPath()` resolves a bare filename (no `/`) against this folder
automatically — you never need to write the `apps/` prefix yourself. A value that already contains
a path separator (`apps/myapp.apk`, `../elsewhere/myapp.apk`, an absolute path) is used as given
instead, so pointing outside this folder still works if you ever need to.

Files here are **not committed** — `.gitignore` excludes `*.apk`/`*.ipa`/`*.app/` repo-wide, plus
this folder explicitly (`apps/*` / `!apps/README.md`). This `README.md` is the only thing in the
folder git actually tracks (git doesn't track empty directories, so without it `apps/` wouldn't
exist after a fresh clone).

This only matters for the "fresh install from a built artifact" path. If your app is already
installed on the device/emulator/simulator, you don't need a file here at all — use
`ANDROID_APP_PACKAGE`+`ANDROID_APP_ACTIVITY` or `IOS_BUNDLE_ID` instead (see `config/environments/
qa.env` for the priority order between the two — `mobileCapabilityBuilder.ts`'s
`resolveAndroidTarget()`/`resolveIosTarget()` is the actual logic if you want to check that's
still current).

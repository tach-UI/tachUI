# @tachui/query

## 0.8.35

### Patch Changes

- [#393](https://github.com/tach-UI/tachUI/pull/393) [`5a6ac09`](https://github.com/tach-UI/tachUI/commit/5a6ac0904f6e4b22af8239a1ebbac8395708db74) Thanks [@whoughton](https://github.com/whoughton)! - Two test-only timing assertions no longer fail on a loaded machine.

  `retryDelay > waits between attempts` allowed a flat 20ms sleep for three
  loads and two 1ms backoffs, then asserted all three had run; under load it saw
  two. It now polls through the helper the file already has for this, so it waits
  on the retries happening rather than on a window elapsing.

  `should validate large registry quickly` budgeted 20ms for about 1ms of work
  and was seen at 22.6ms. Widened to 200ms, which still catches a superlinear
  regression over 1000 modifiers without measuring the machine.

- Updated dependencies [[`3f061b5`](https://github.com/tach-UI/tachUI/commit/3f061b54bb6096fb4555282ece8f5dd9e7fb495c)]:
  - @tachui/core@0.11.2

## 0.8.34

### Patch Changes

- Updated dependencies [[`23c5c26`](https://github.com/tach-UI/tachUI/commit/23c5c26e90085bb665d3e18b75b5763dbf2709fa), [`e58bce2`](https://github.com/tach-UI/tachUI/commit/e58bce248829451c8e89a9af5ab19705dd806f57)]:
  - @tachui/core@0.11.1

## 0.8.33

### Patch Changes

- Updated dependencies [[`a6d0668`](https://github.com/tach-UI/tachUI/commit/a6d06680e3212b5e5dfe11c60d43ad04ae7e131a), [`9864d4c`](https://github.com/tach-UI/tachUI/commit/9864d4cab381e92abfc365f7749b9608636e4bb5), [`b30f4a3`](https://github.com/tach-UI/tachUI/commit/b30f4a3c80a816398ed644fe2f489c1ca532318b), [`a2e553b`](https://github.com/tach-UI/tachUI/commit/a2e553b39c649240e5f361c6d925394ccba17d2b), [`0c10b49`](https://github.com/tach-UI/tachUI/commit/0c10b4945aefaf290a2779fa44c0a12ff2fc0d8a), [`eabe555`](https://github.com/tach-UI/tachUI/commit/eabe55501766e5da320e42e65420dbd64e71e616), [`1c3099d`](https://github.com/tach-UI/tachUI/commit/1c3099d059b03af704ed91ead50079bc36e92007), [`b2335fe`](https://github.com/tach-UI/tachUI/commit/b2335fe0c43a9704b6544af48a54071529d2f441), [`eabe555`](https://github.com/tach-UI/tachUI/commit/eabe55501766e5da320e42e65420dbd64e71e616)]:
  - @tachui/core@0.11.0

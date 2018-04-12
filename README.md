# lambda-edge-controller
Lambda@EdgeのFunctionを管理する用ライブラリ。
AMIMOTO / Shifter両方での利用を想定しています。

## Getting starged

Update `package.json` to install the libs.

```
"dependencies": {
  ...
  "lambda-edge-controller": "git+https://{YOUR_GITHUB_TOKEN}:x-oauth-basic@github.com/megumiteam/lambda-edge-controller"
}
```

And run `npm install` command.


## Usage

```
// Load libs
const { BandwithLimiter } = require('lambda-edge-controller')

// define lambda arn
const lambdaArn = 'arn:aws:lambda:us-east-1:function:{name}:{version}'

// Initialize the class
const limitter = new BandwithLimiter(lambdaArn)

// To attach bandwith limitter
limitter.attachBandwithLimitLambda('DIST_ID')
  .then(result => console.log(result))

// To detach bandwith limitter
limitter.detachBandWithLambdaWf('DIST_ID')
  .then(result => console.log(result))

```

## Development

### getting started

```
$ git clone git@github.com:megumiteam/lambda-edge-controller.git
$ cd lambda-edge-controller
$ npm i
```

### Unit test

```
$ npm test
```

### Lint

```
$ npm run lint

// auto fix
$ npm run lint -- --fix
```

### Release

```
$ git tag vX.X.X
$ git push origin vX.X.X
```

class bandwithLimiter {
  /**
   * constructor
   *
   * @param {string} lambdaArn - Lambda arn
   * @param {string} [stage='development'] - stage
   **/
  constructor (lambdaArn, stage = 'development') {
    this.stage = stage === 'production' ? stage : 'development'
    this.lambdaArn = lambdaArn
  }
}

module.exports = bandwithLimiter

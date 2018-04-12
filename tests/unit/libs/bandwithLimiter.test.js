const assert = require('power-assert')
const BandwithLimiter = require('../../../libs/bandwithLimiter')

describe('libs/bandwithLimiter.js', () => {
  describe('constructor', () => {
    it('should set development stage when given no params', () => {
      const c = new BandwithLimiter('lambdaArn')
      assert.equal(c.stage, 'development')
    })
    it('should set development stage when given development string', () => {
      const c = new BandwithLimiter('lambdaArn', 'development')
      assert.equal(c.stage, 'development')
    })
    it('should set development stage when given invalid string', () => {
      const c = new BandwithLimiter('lambdaArn', 'hogehoge')
      assert.equal(c.stage, 'development')
    })
    it('should set production stage when given production string', () => {
      const c = new BandwithLimiter('lambdaArn', 'production')
      assert.equal(c.stage, 'production')
    })
    it('should set valid arn', () => {
      const c = new BandwithLimiter('lambdaArn')
      assert.equal(c.lambdaArn, 'lambdaArn')
    })
  })
})

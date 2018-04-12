const defaultCFClass = require('./cloudfront')

class BandwithLimiter {
  /**
   * constructor
   *
   * @param {string} lambdaArn - Lambda arn
   * @param {string} [stage='development'] - stage
   * @param {Class} CloudFront - AWS SDK class of CloudFront
   **/
  constructor (lambdaArn, stage = 'development', CloudFront = defaultCFClass) {
    this.stage = stage === 'production' ? stage : 'development'
    this.lambdaArn = lambdaArn
    this.cloudfront = new CloudFront()
  }
  /**
   * get lambda arn
   *
   * @return {string} lambda arn
   **/
  getLambdaArn () {
    return this.lambdaArn
  }
  /**
   * Detach bandwithLimiter lambda from CloudFront Distribution
   *
   * @param {string} distributionId - CloudFront Distribution ID
   * @return {Promise} results of the workflow
   **/
  detachBandWithLambdaWf (distributionId) {
    return this.cloudfront
      .getCloudFrontDistribution(distributionId)
      .then(data => {
        const distribution = data.Distribution
        const config = this.createUpdateDistributionConfig(
          distribution.DistributionConfig,
          'detachBandwithLimit'
        )
        const params = this.createUpdateDistributionParam(data, config)
        return this.cloudfront.updateDistribution(params)
      })
  }
  /**
   * Attach bandwithLimiter lambda from CloudFront Distribution
   *
   * @param {string} distributionId - CloudFront Distribution ID
   * @return {Promise} results of the workflow
   **/
  attachBandWithLambdaWf (distributionId) {
    return this.cloudfront
      .getCloudFrontDistribution(distributionId)
      .then(data => {
        const distribution = data.Distribution
        const config = this.createUpdateDistributionConfig(
          distribution.DistributionConfig,
          'attachBandwithLimit'
        )
        const params = this.createUpdateDistributionParam(data, config)
        return this.cloudfront.updateDistribution(params)
      })
  }
  /**
   * Generate update CloudFront distribution params
   *
   * @param {object} data - cloudfront.getCloudFrontDistribution results
   * @param {object} config - updated distribution config
   * @return {object} update distribution param
   **/
  createUpdateDistributionParam (data, config) {
    const distribution = data.Distribution
    const params = {
      Id: distribution.Id,
      IfMatch: data.ETag,
      DistributionConfig: config
    }
    return params
  }
  /**
   * Generate update CloudFront distribution config
   *
   * @param {object} distribution - CloudFront distribution data
   * @param {string} action - update action type
   * @return {Promise} results of the workflow
   **/
  createUpdateDistributionConfig (config, action) {
    switch (action) {
      case 'detachBandwithLimit':
        return this.detachBandwithLimitLambda(config)
      case 'attachBandwithLimit':
        return this.attachBandwithLimitLambda(config)
      default:
        return config
    }
  }
  /**
   * Check lambda function arn
   *
   * @param {string} arn - Lambda Arn
   * @return {bool} result
   **/
  isBandwithLimitLambdaArn (arn) {
    if (this.getLambdaArn() === arn) return true
    return false
  }
  /**
   * update distribution config to detach bandwithLimiter
   *
   * @param {object} config - CloudFront distribution config
   * @return {object} updated distribution config
   **/
  detachBandwithLimitLambda (config) {
    const defaultCacheBehavior = config.DefaultCacheBehavior
    const lambdas = defaultCacheBehavior.LambdaFunctionAssociations
    if (lambdas.Quantity < 1) return config
    const newLambdaItems = []
    lambdas.Items.forEach(item => {
      if (!item.EventType) return
      if (
        item.EventType === 'viewer-request' &&
        this.isBandwithLimitLambdaArn(item.LambdaFunctionARN)
      ) {
        return
      }
      return newLambdaItems.push(item)
    })
    lambdas.Quantity = newLambdaItems.length
    lambdas.Items = newLambdaItems
    config.DefaultCacheBehavior.LambdaFunctionAssociations = lambdas
    return config
  }
  /**
   * update distribution config to attach bandwithLimiter
   *
   * @param {object} config - CloudFront distribution config
   * @return {object} updated distribution config
   **/
  attachBandwithLimitLambda (config) {
    const param = this.detachBandwithLimitLambda(config)
    const defaultCacheBehavior = param.DefaultCacheBehavior
    const lambdas = defaultCacheBehavior.LambdaFunctionAssociations
    const newItem = {
      LambdaFunctionARN: this.getLambdaArn(),
      EventType: 'viewer-request'
    }
    lambdas.Items.push(newItem)
    lambdas.Quantity = lambdas.Items.length
    param.DefaultCacheBehavior.LambdaFunctionAssociations = lambdas
    return param
  }
}

module.exports = BandwithLimiter

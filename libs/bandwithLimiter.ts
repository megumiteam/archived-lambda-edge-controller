import { CloudFront } from 'aws-sdk'
const defaultCFClass = require('./cloudfront')

const defaultLambdaFunctionAssociations: CloudFront.Types.LambdaFunctionAssociations  = {
  Quantity: 0,
  Items: []
}

class BandwithLimiter {
  private stage: 'production' | 'development'
  private lambdaArn: string
  private cloudfront: CloudFront
  /**
   * constructor
   *
   * @param {string} lambdaArn - Lambda arn
   * @param {string} [stage='development'] - stage
   * @param {Class} CloudFront - AWS SDK class of CloudFront
   **/
  constructor (lambdaArn: string, stage: string = 'development', cf: CloudFront = new CloudFront()) {
    this.stage = stage === 'production' ? stage : 'development'
    this.lambdaArn = lambdaArn
    this.cloudfront = cf
  }
  /**
   * get lambda arn
   *
   * @return {string} lambda arn
   **/
  getLambdaArn (): string {
    return this.lambdaArn
  }
  getStage(): 'production' | 'development' {
    return this.stage
  }
  getClient(): CloudFront {
    return this.cloudfront
  }
  /**
   * Detach bandwithLimiter lambda from CloudFront Distribution
   *
   * @param {string} distributionId - CloudFront Distribution ID
   * @return {Promise} results of the workflow
   **/
  async detachBandWithLambdaWf (distributionId: string): Promise<CloudFront.UpdateDistributionResult> {
    const data = await this.cloudfront.getDistribution({Id: distributionId}).promise()
    if (!data.Distribution) throw new Error('No such distribution')
    const config = await this.createUpdateDistributionConfig(
      data.Distribution.DistributionConfig,
      'detachBandwithLimit'
    )
    const params = this.createUpdateDistributionParam(data, config)
    return this.cloudfront.updateDistribution(params).promise()
  }
  /**
   * Attach bandwithLimiter lambda from CloudFront Distribution
   *
   * @param {string} distributionId - CloudFront Distribution ID
   * @return {Promise} results of the workflow
   **/
  async attachBandWithLambdaWf (distributionId: string): Promise<CloudFront.UpdateDistributionResult> {
    const data = await this.cloudfront.getDistribution({Id: distributionId}).promise()
    if (!data || !data.Distribution) throw new Error('No such distribution')
    const config = await this.createUpdateDistributionConfig(
      data.Distribution.DistributionConfig,
      'attachBandwithLimit'
    )
    const params = this.createUpdateDistributionParam(data, config)
    return this.cloudfront.updateDistribution(params).promise()
  }
  /**
   * Generate update CloudFront distribution params
   *
   * @param {object} data - cloudfront.getCloudFrontDistribution results
   * @param {object} config - updated distribution config
   * @return {object} update distribution param
   **/
  createUpdateDistributionParam (data: CloudFront.GetDistributionResult, config: CloudFront.Types.DistributionConfig): CloudFront.UpdateDistributionRequest {
    if (!data || !data.Distribution) throw new Error('No such distribution')
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
  createUpdateDistributionConfig (config: CloudFront.Types.DistributionConfig, action: string): CloudFront.Types.DistributionConfig {
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
  isBandwithLimitLambdaArn (arn: string): boolean {
    if (this.getLambdaArn() === arn) return true
    return false
  }
  /**
   * update distribution config to detach bandwithLimiter
   *
   * @param {object} config - CloudFront distribution config
   * @return {object} updated distribution config
   **/
  detachBandwithLimitLambda (config: CloudFront.Types.DistributionConfig): CloudFront.Types.DistributionConfig {
    const defaultCacheBehavior = config.DefaultCacheBehavior
    const lambdas: CloudFront.Types.LambdaFunctionAssociations = defaultCacheBehavior.LambdaFunctionAssociations || defaultLambdaFunctionAssociations
    if (lambdas.Quantity < 1 || !lambdas.Items) return config
    const newLambdaItems: CloudFront.Types.LambdaFunctionAssociationList = []
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
  attachBandwithLimitLambda (config: CloudFront.Types.DistributionConfig): CloudFront.Types.DistributionConfig {
    const param = this.detachBandwithLimitLambda(config)
    const defaultCacheBehavior = param.DefaultCacheBehavior
    const lambdas: CloudFront.Types.LambdaFunctionAssociations = defaultCacheBehavior.LambdaFunctionAssociations || defaultLambdaFunctionAssociations
    const newItem = {
      LambdaFunctionARN: this.getLambdaArn(),
      EventType: 'viewer-request'
    }
    if (!lambdas.Items) {
      lambdas.Items = [newItem]
    } else {
      lambdas.Items.push(newItem)
    }
    lambdas.Quantity = lambdas.Items.length
    param.DefaultCacheBehavior.LambdaFunctionAssociations = lambdas
    return param
  }
}

module.exports = BandwithLimiter
export default BandwithLimiter

import AWS from 'aws-sdk'

class Cloudfront {
  protected cloudfront: AWS.CloudFront;
  /**
   * constructor
   *
   **/
  constructor (client: AWS.CloudFront = new AWS.CloudFront()) {
    this.cloudfront = client
  }
  /**
   * Get CloudFront Distribution
   *
   * @param {string} distributionId - CloudFront Distribution ID
   * @return {Promise} result of cloudfront.getDistribution api
   **/
  getCloudFrontDistribution (distributionId: string): Promise<AWS.CloudFront.Types.GetDistributionConfigResult> {
    const param = {
      Id: distributionId
    }
    return this.cloudfront.getDistribution(param).promise()
  }
  /**
   * update CloudFront distribution config
   *
   * @param {object} params - update params
   * @return {Promise} result of cloudfront.updateDistribution api
   **/
  updateDistribution (params: AWS.CloudFront.Types.UpdateDistributionRequest): Promise<AWS.CloudFront.Types.UpdateDistributionResult> {
    return this.cloudfront.updateDistribution(params).promise()
  }
}
module.exports = Cloudfront
export default Cloudfront

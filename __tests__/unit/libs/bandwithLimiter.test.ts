import { CloudFront } from 'aws-sdk'
import assert = require('assert');
import BandwithLimiter from '../../../libs/bandwithLimiter'

class DummyClass {}

describe('libs/bandwithLimiter.js', () => {
  describe('constructor', () => {
    it('should set development stage when given no params', () => {
      const c = new BandwithLimiter('lambdaArn')
      assert.equal(c.getStage(), 'development')
    })
    it('should set development stage when given development string', () => {
      const c = new BandwithLimiter('lambdaArn', 'development')
      assert.equal(c.getStage(), 'development')
    })
    it('should set development stage when given invalid string', () => {
      const c = new BandwithLimiter('lambdaArn', 'hogehoge')
      assert.equal(c.getStage(), 'development')
    })
    it('should set production stage when given production string', () => {
      const c = new BandwithLimiter('lambdaArn', 'production')
      assert.equal(c.getStage(), 'production')
    })
    it('should set valid arn', () => {
      const c = new BandwithLimiter('lambdaArn')
      assert.equal(c.getLambdaArn(), 'lambdaArn')
    })
    it('should set dummy class', () => {
      const c = new BandwithLimiter('lambdaArn', 'hogehoge', new DummyClass() as CloudFront)
      assert.equal(c.getClient() instanceof DummyClass, true)
    })
  })
  describe('methods', () => {
    let c: any
    beforeEach(() => {
      c = new BandwithLimiter('bandwith-lambda-arn')
    })
    describe('#getLambdaArn()', () => {
      it('should return lambda arn', () => {
        assert.equal(c.getLambdaArn(), 'bandwith-lambda-arn')
      })
    })
    describe('#updateEventType()', () => {
      it('should return default event type', () => {
        assert.equal(c.getTargetEventType(), 'viewer-request')
      })
      it('should update event type', () => {
        c.updateEventType('origin-request')
        assert.equal(c.getTargetEventType(), 'origin-request')
      })
    })
    describe('#createUpdateDistributionParam()', () => {
      const data = {
        Distribution: {
          Id: 'distribution id'
        },
        ETag: 'etag'
      }
      const config = {
        param: true
      }
      it('should return valid update params', () => {
        const params = c.createUpdateDistributionParam(data, config)
        assert.deepEqual(params, {
          Id: 'distribution id',
          IfMatch: 'etag',
          DistributionConfig: {
            param: true
          }
        })
      })
    })
    describe('#isBandwithLimitLambdaArn()', () => {
      it('should return true when given same arn', () => {
        assert.equal(c.isBandwithLimitLambdaArn('bandwith-lambda-arn'), true)
      })
      it('should return false when given different arn', () => {
        assert.equal(c.isBandwithLimitLambdaArn('arn-1'), false)
      })
    })
    describe('detachBandwithLimitLambda', () => {
      it('return same param when given no associated bandwith lambda', () => {
        const distributionConfig = {
          DefaultCacheBehavior: {
            LambdaFunctionAssociations: {
              Quantity: 0,
              Items: []
            }
          }
        }
        const result = c.detachBandwithLimitLambda(distributionConfig)
        assert.deepEqual(
          {
            DefaultCacheBehavior: {
              LambdaFunctionAssociations: {
                Quantity: 0,
                Items: []
              }
            }
          },
          result
        )
      })
      it('return same param when given no associated bandwith lambda', () => {
        const distributionConfig = {
          DefaultCacheBehavior: {
            LambdaFunctionAssociations: {
              Quantity: 1,
              Items: [
                {
                  EventType: 'hoge',
                  LambdaFunctionARN: 'arn'
                }
              ]
            }
          }
        }
        const result = c.detachBandwithLimitLambda(distributionConfig)
        assert.deepEqual(
          {
            DefaultCacheBehavior: {
              LambdaFunctionAssociations: {
                Quantity: 1,
                Items: [
                  {
                    EventType: 'hoge',
                    LambdaFunctionARN: 'arn'
                  }
                ]
              }
            }
          },
          result
        )
      })
      it('return new param that removed bandwith Lambda when given associated bandwith lambda', () => {
        const distributionConfig = {
          DefaultCacheBehavior: {
            LambdaFunctionAssociations: {
              Quantity: 1,
              Items: [
                {
                  EventType: 'viewer-request',
                  LambdaFunctionARN: 'bandwith-lambda-arn'
                }
              ]
            }
          }
        }
        const result = c.detachBandwithLimitLambda(distributionConfig)
        assert.deepEqual(
          {
            DefaultCacheBehavior: {
              LambdaFunctionAssociations: {
                Quantity: 0,
                Items: []
              }
            }
          },
          result
        )
      })
    })
    it('return new param that removed bandwith Lambda when given associated bandwith lambda and more', () => {
      const distributionConfig = {
        DefaultCacheBehavior: {
          LambdaFunctionAssociations: {
            Quantity: 2,
            Items: [
              {
                EventType: 'viewer-request',
                LambdaFunctionARN: 'bandwith-lambda-arn'
              },
              {
                EventType: 'hoge',
                LambdaFunctionARN: 'arn'
              }
            ]
          }
        }
      }
      const result = c.detachBandwithLimitLambda(distributionConfig)
      assert.deepEqual(
        {
          DefaultCacheBehavior: {
            LambdaFunctionAssociations: {
              Quantity: 1,
              Items: [
                {
                  EventType: 'hoge',
                  LambdaFunctionARN: 'arn'
                }
              ]
            }
          }
        },
        result
      )
    })
    describe('#attachBandwithLimitLambda()', () => {
      it('should attach bandwith lambda arn when given no associated lambda@edge', () => {
        const distributionConfig = {
          DefaultCacheBehavior: {
            LambdaFunctionAssociations: {
              Quantity: 0,
              Items: []
            }
          }
        }
        const result = c.attachBandwithLimitLambda(distributionConfig)
        assert.deepEqual(
          {
            DefaultCacheBehavior: {
              LambdaFunctionAssociations: {
                Quantity: 1,
                Items: [
                  {
                    EventType: 'viewer-request',
                    LambdaFunctionARN: 'bandwith-lambda-arn'
                  }
                ]
              }
            }
          },
          result
        )
      })
      it('should attach bandwith lambda arn when given no associated lambda@edge', () => {
        const distributionConfig = {
          DefaultCacheBehavior: {
            LambdaFunctionAssociations: {
              Quantity: 2,
              Items: [
                {
                  EventType: 'viewer-request',
                  LambdaFunctionARN: 'bandwith-lambda-arn'
                },
                {
                  EventType: 'hoge',
                  LambdaFunctionARN: 'arn'
                }
              ]
            }
          }
        }
        const result = c.attachBandwithLimitLambda(distributionConfig)
        assert.deepEqual(
          {
            DefaultCacheBehavior: {
              LambdaFunctionAssociations: {
                Quantity: 2,
                Items: [
                  {
                    EventType: 'hoge',
                    LambdaFunctionARN: 'arn'
                  },
                  {
                    EventType: 'viewer-request',
                    LambdaFunctionARN: 'bandwith-lambda-arn'
                  }
                ]
              }
            }
          },
          result
        )
      })
    })
  })
})

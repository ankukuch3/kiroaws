#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { AppStack } from '../lib/app-stack';

declare const process: any;

const app = new cdk.App();
const stackName = process.env.STACK_NAME || 'AppStack';

new AppStack(app, stackName, {
  env: { 
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1'
  },
  description: 'Micro Blogging Application Stack'
});

import util from 'util';
import { Context } from 'fabric-contract-api';
import { keys, omit } from 'lodash';
import { Commit } from '..';
import { serialize, splitKey } from '.';

export class StateList {
  constructor(public ctx: Context, public name: string) {}

  async getQueryResult(attributes: string[], plainObject?: boolean) {
    const promises = this.ctx.stub.getStateByPartialCompositeKey('entities', attributes);
    const result: any = {};

    try {
      for await (const res of promises) {
        const commit = JSON.parse(res.value.toString());
        result[commit.commitId] = omit(commit, 'key');
      }
    } catch (e) {
      console.error(e);
      throw new Error(util.format('fail to getQueryResult, %j', e));
    }
    return plainObject ? result : Buffer.from(JSON.stringify(result));
  }

  async addState(commit: Commit) {
    await this.ctx.stub.putState(this.ctx.stub.createCompositeKey(this.name, splitKey(commit.key)), serialize(commit));
  }

  async getState(key): Promise<Commit> {
    let result;

    const data = await this.ctx.stub.getState(this.ctx.stub.createCompositeKey(this.name, splitKey(key)));

    try {
      result = data.toString() ? JSON.parse(data.toString()) : Object.assign({});
    } catch (e) {
      console.error(e);
      throw new Error(util.format('fail to parse data, %j', e));
    }

    return result;
  }

  async deleteState(commit: Commit) {
    await this.ctx.stub.deleteState(this.ctx.stub.createCompositeKey(this.name, splitKey(commit.key)));
  }

  async deleteStateByEnityId(attributes: string[]) {
    const promises = this.ctx.stub.getStateByPartialCompositeKey('entities', attributes);
    const result = {};
    try {
      for await (const res of promises) {
        const { key, commitId } = JSON.parse(res.value.toString());
        await this.ctx.stub.deleteState(this.ctx.stub.createCompositeKey('entities', splitKey(key)));
        result[commitId] = {};
      }
    } catch (e) {
      console.error(e);
      throw new Error(util.format('fail to deleteStateByEnityId, %j', e));
    }

    return Buffer.from(
      JSON.stringify({
        status: 'SUCCESS',
        message: `${keys(result).length} record(s) deleted`,
        result
      })
    );
  }

}

import { Context } from 'fabric-contract-api';
import { keys, omit } from 'lodash';
import { serialize, splitKey } from '.';
import { Commit } from '..';

export class StateList {
  constructor(public ctx: Context, public name: string) {}

  async getQueryResult(attributes: string[]) {
    const iterator = await this.ctx.stub.getStateByPartialCompositeKey(
      'entities',
      attributes
    );
    const result: any = {};
    while (true) {
      const { value, done } = await iterator.next();
      if (value && value.value.toString()) {
        const commit = JSON.parse((value.value as Buffer).toString('utf8'));
        result[commit.commitId] = omit(commit, 'key');
      }
      if (done) {
        await iterator.close();
        return Buffer.from(JSON.stringify(result));
      }
    }
  }

  async addState(commit: Commit) {
    await this.ctx.stub.putState(
      this.ctx.stub.createCompositeKey(this.name, splitKey(commit.key)),
      serialize(commit)
    );
  }

  async getState(key): Promise<Commit> {
    const data = await this.ctx.stub.getState(
      this.ctx.stub.createCompositeKey(this.name, splitKey(key))
    );
    if (data.toString()) {
      return JSON.parse(data.toString());
    } else return Object.assign({});
  }

  async deleteState(commit: Commit) {
    await this.ctx.stub.deleteState(
      this.ctx.stub.createCompositeKey(this.name, splitKey(commit.key))
    );
  }

  async deleteStateByEnityId(attributes: string[]) {
    const iterator = await this.ctx.stub.getStateByPartialCompositeKey(
      'entities',
      attributes
    );
    const result = {};
    while (true) {
      const { value, done } = await iterator.next();
      if (value && value.value.toString()) {
        const { key, commitId } = JSON.parse(
          (value.value as Buffer).toString('utf8')
        );
        await this.ctx.stub.deleteState(
          this.ctx.stub.createCompositeKey('entities', splitKey(key))
        );
        result[commitId] = {};
      } else {
        return {
          status: 'SUCCESS',
          message: 'No state returned for deletion'
        };
      }
      // else throw new Error('no state returned');
      if (done) {
        await iterator.close();
        return Buffer.from(
          JSON.stringify({
            status: 'SUCCESS',
            message: `${keys(result).length} records deleted`,
            result
          })
        );
      }
    }
  }
}

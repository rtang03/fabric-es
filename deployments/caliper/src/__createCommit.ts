import { WorkloadModuleBase, BlockchainInterface } from '@hyperledger/caliper-core';

class Workload extends WorkloadModuleBase {
  account_array: any[];
  initmoney: number;

  constructor() {
    super();
    this.account_array = [];
    this.initmoney = 0;
  }

  /**
   * Initialize the workload module with the given parameters.
   * @param {number} workerIndex The 0-based index of the worker instantiating the workload module.
   * @param {number} totalWorkers The total number of workers participating in the round.
   * @param {number} roundIndex The 0-based index of the currently executing round.
   * @param {Object} roundArguments The user-provided arguments for the round from the benchmark configuration file.
   * @param {BlockchainInterface} sutAdapter The adapter of the underlying SUT.
   * @param {Object} sutContext The custom context object provided by the SUT adapter.
   * @async
   */
  async initializeWorkloadModule(
    workerIndex,
    totalWorkers,
    roundIndex,
    roundArguments,
    sutAdapter: BlockchainInterface,
    sutContext
  ) {

    await super.initializeWorkloadModule(
      workerIndex,
      totalWorkers,
      roundIndex,
      roundArguments,
      sutAdapter,
      sutContext
    );

    if (!roundArguments.hasOwnProperty('money')) {
      throw new Error('account.transfer - \'money\' is missed in the arguments');
    }

    this.initmoney = roundArguments.money;

    const open = require('./open.js');
    this.account_array = open.account_array;
  }
}

export default Workload;

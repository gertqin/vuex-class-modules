import { RegisterOptions } from "./module-factory";
import { WatchOptions } from "vue";

export class VuexModule {
  private __options: RegisterOptions;
  constructor(options: RegisterOptions) {
    this.__options = options;
  }

  $watch<T>(fn: (arg: this) => T, callback: (newValue: T, oldValue: T) => void, options?: WatchOptions): Function {
    return function() {};
  }
}

import { RegisterOptions } from "./module-factory";

export class VuexModule {
  private __options: RegisterOptions;
  constructor(options: RegisterOptions) {
    this.__options = options;
  }
}

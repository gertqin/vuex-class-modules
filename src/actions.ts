import { VuexClassModule } from "./module";

export function Action<T>(
  target: T,
  key: string | symbol,
  descriptor: TypedPropertyDescriptor<(arg?: any) => Promise<void>>
) {
  const vuexModule = target.constructor as VuexClassModule;
  if (!vuexModule.__actions) {
    vuexModule.__actions = {};
  }
  // tslint:disable-next-line:no-empty
  const actionFunc = descriptor.value ? descriptor.value : async () => {};
  vuexModule.__actions[key as string] = actionFunc;
}

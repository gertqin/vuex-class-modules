import { VuexClassModule } from "./module";

export function Mutation<T>(target: T, key: string | symbol, descriptor: TypedPropertyDescriptor<(arg?: any) => void>) {
  const vuexModule = target.constructor as VuexClassModule;
  if (!vuexModule.__mutations) {
    vuexModule.__mutations = {};
  }
  // tslint:disable-next-line:no-empty
  const mutationFunc = descriptor.value ? descriptor.value : () => {};
  vuexModule.__mutations[key as string] = mutationFunc;
}

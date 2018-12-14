import { VuexClassModuleFactory, ModuleOptions, IVuexModule } from "./module-factory";

export function Module(options?: ModuleOptions): ClassDecorator {
  return moduleDecoratorFactory(options);
}

function moduleDecoratorFactory(moduleOptions?: ModuleOptions) {
  return <TFunction extends Function>(constructor: TFunction): TFunction | void => {
    const accessor: any = function(...args: any[]) {
      const instance = new constructor.prototype.constructor(...args) as IVuexModule;

      const factory = new VuexClassModuleFactory(constructor, instance, moduleOptions || {});

      factory.registerVuexModule();
      return factory.buildAccessor(instance);
    };
    accessor.prototype = constructor.prototype;
    return accessor;
  };
}

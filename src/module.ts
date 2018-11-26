import { VuexClassModuleFactory, ModuleOptions } from "./module-factory";

export function Module(options: ModuleOptions): ClassDecorator {
  return moduleDecoratorFactory(options);
}

function moduleDecoratorFactory(moduleOptions: ModuleOptions) {
  return <TFunction extends Function>(constructor: TFunction): TFunction | void => {
    const factory = new VuexClassModuleFactory(constructor, moduleOptions);
    factory.registerVuexModule();

    const accessor: any = function() {
      return factory.buildAccessor();
    };
    accessor.prototype = constructor.prototype;
    return accessor;
  };
}

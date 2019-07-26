export type ConfigSimpleValue = string | number | boolean;

export type ConfigValue = ConfigSimpleValue | ConfigTree;

export interface ConfigTree {
    [name: string]: ConfigValue;
}

export type PartialConfigTree<Config extends ConfigTree> = {
    [K in keyof Config]?: Config[K] extends ConfigTree
        ? PartialConfigTree<Config[K]>
        : ConfigSimpleValue
};

export const DEFAULT_UNKNOWN_CONFIG_WARN_METHOD = (propName: string) => {
    console.warn(`Unknown config ${propName}`);
};

const ENV_PARSERS = {
    string: (str) => str,
    number: (str) => parseFloat(str),
    boolean: (str) => str.toLowerCase() in {true: 1, yes: 1, enable: 1, enabled: 1, 1: 1},
};

export function cloneConfig<Config extends ConfigTree>(config: Config): Config {
    const res: any = {};
    for (const key in config) {
        if (config.hasOwnProperty(key)) {
            if (typeof config[key] === 'object') {
                res[key] = cloneConfig(config[key] as any);
            } else {
                res[key] = config[key];
            }
        }
    }
    return res as Config;
}

export function populateConfig<Config extends ConfigTree>(
    target: Config,
    source: PartialConfigTree<Config>,
    unknownConfigWarn: (propName: string) => void = DEFAULT_UNKNOWN_CONFIG_WARN_METHOD,
    prefix: string = '',
): Config {
    for (const key in source) {
        if (!source.hasOwnProperty(key)) {
            continue;
        }
        if (!target.hasOwnProperty(key)) {
            unknownConfigWarn(prefix + key);
            continue;
        }
        if (typeof source[key] !== typeof target[key]) {
            throw new Error(`Config type mismatch on property "${key}"`);
        }
        if (typeof source[key] === 'object') {
            populateConfig(target[key] as any, source[key] as any, unknownConfigWarn, `${prefix}${key}.`);
        } else {
            target[key] = source[key];
        }
    }
    return target;
}

export function populateConfigWithString<Config extends ConfigTree>(
    target: Config,
    str: string,
    type: 'json' | 'yaml' | 'yml',
    unknownConfigWarn: (propName: string) => void = DEFAULT_UNKNOWN_CONFIG_WARN_METHOD,
): Config {
    switch (type) {
        case 'json':
            return populateConfig(target, JSON.parse(str), unknownConfigWarn);
        case 'yaml':
        case 'yml':
            const loadYaml = require.main.require('js-yaml').safeLoad;
            return populateConfig(target, loadYaml(str), unknownConfigWarn);
        default:
            throw new Error('Unknown config type');
    }
}

export function populateConfigWithFileSync<Config extends ConfigTree>(
    target: Config,
    filename: string,
    unknownConfigWarn: (propName: string) => void = DEFAULT_UNKNOWN_CONFIG_WARN_METHOD,
): Config {
    const fs = require('fs');
    return populateConfigWithString(
        target,
        fs.readFileSync(filename, {encoding: 'utf8'}),
        (filename.match(/\.([a-z0-9]+)$/)[1] as any),
        unknownConfigWarn,
    );
}

export async function populateConfigWithFile<Config extends ConfigTree>(
    target: Config,
    filename: string,
    unknownConfigWarn: (propName: string) => void = DEFAULT_UNKNOWN_CONFIG_WARN_METHOD,
): Promise<Config> {
    const fs = require('fs');
    return populateConfigWithString(
        target,
        await new Promise<string>((resolve, reject) => {
            fs.readFile(filename, {encoding: 'utf8'}, (err, data) => {
                err ? reject(err) : resolve(data);
            });
        }),
        (filename.match(/\.([a-z0-9]+)$/)[1] as any),
        unknownConfigWarn,
    );
}

export function populateConfigWithEnv <Config extends ConfigTree>(
    target: Config,
    prefix: string,
    dict: NodeJS.ProcessEnv = process.env,
): Config {
    for (const key in target) {
        if (target.hasOwnProperty(key)) {
            if (typeof target[key] === 'object') {
                populateConfigWithEnv(target[key] as ConfigTree, `${prefix}${key}_`, dict);
                continue;
            }
            const varValue = dict[(prefix + key).toUpperCase()];
            if (varValue !== undefined) {
                target[key] = ENV_PARSERS[typeof target[key]](varValue);
            }
        }
    }
    return target;
}

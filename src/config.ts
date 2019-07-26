import {
    cloneConfig,
    ConfigTree,
    DEFAULT_UNKNOWN_CONFIG_WARN_METHOD,
    PartialConfigTree,
    populateConfig,
    populateConfigWithEnv,
    populateConfigWithFile,
    populateConfigWithFileSync,
    populateConfigWithString,
} from './methods';

export class ConfigGenerator<Config extends ConfigTree> {
    public config: Config;

    private unknownConfigWarn = DEFAULT_UNKNOWN_CONFIG_WARN_METHOD;

    constructor(config: Config) {
        this.config = cloneConfig(config);
    }

    public fromObject(
        source: PartialConfigTree<Config>,
    ) {
        populateConfig(this.config, source, this.unknownConfigWarn);
        return this;
    }

    public fromString(str: string, type: 'json' | 'yaml' | 'yml') {
        populateConfigWithString(this.config, str, type, this.unknownConfigWarn);
        return this;
    }

    public async fromFile(filename: string): Promise<ConfigGenerator<Config>> {
        await populateConfigWithFile(this.config, filename, this.unknownConfigWarn);
        return this;
    }

    public fromFileSync(filename: string): ConfigGenerator<Config> {
        populateConfigWithFileSync(this.config, filename, this.unknownConfigWarn);
        return this;
    }

    public fromEnv(prefix: string, dict: NodeJS.ProcessEnv = process.env) {
        populateConfigWithEnv(this.config, prefix, dict);
        return this;
    }

    public setUnknownConfigHandler(handler: (propName: string) => void) {
        this.unknownConfigWarn = handler;
        return this;
    }
}

export function configGenerator<Config extends ConfigTree>(config: Config) {
    return new ConfigGenerator<Config>(config);
}

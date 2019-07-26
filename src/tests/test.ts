import 'source-map-support/register';

import * as assert from 'assert';
import { configGenerator } from '../config';

describe('msv-config', () => {
    const baseConfig = {
        str: 'asdasd',
        str2: 'aaa',
        num: 15,
        num2: 14,
        obj: {
            bool: true,
            bool2: true,
        },
        obj2: {
            bool: true,
            str: 'asd',
        },
    };

    it('should be immutable', () => {
        const config = configGenerator(baseConfig).config;
        config.str = '123';
        config.obj.bool = false;
        assert.equal(baseConfig.str, 'asdasd');
        assert.equal(baseConfig.obj.bool, true);
    });

    it('should merge object', () => {
        const config = configGenerator(baseConfig).fromObject({
            str: 'uuu',
            num: 72,
            obj: {
                bool: false,
            },
        }).config;
        assert.deepStrictEqual(config, {
            str: 'uuu',
            str2: 'aaa',
            num: 72,
            num2: 14,
            obj: {
                bool: false,
                bool2: true,
            },
            obj2: {
                bool: true,
                str: 'asd',
            },
        });
    });

    it('should throw error on wrong config', () => {
        assert.throws(() => {
            configGenerator(baseConfig).fromObject({
                str: 15,
            });
        });
    });

    it('should notify on unknown config property', () => {
        const unknownProps = {};
        configGenerator(baseConfig)
            .setUnknownConfigHandler((prop) => {
                unknownProps[prop] = true;
            })
            .fromObject({
                str3: 15,
                obj: {
                    bool: false,
                    aa: '123',
                },
                obj3: {
                    bool: false,
                },
            } as any);
        assert.deepStrictEqual(unknownProps, {
            'str3': true,
            'obj.aa': true,
            'obj3': true,
        });
    });

    it('should merge env vars', () => {
        const config = configGenerator(baseConfig).fromEnv(
            'APP_',
            {
                APP_STR: '456',
                APP_OBJ_BOOL2: 'FALSE',
                APP_NUM: '32',
            },
        ).config;
        assert.deepStrictEqual(config, {
            str: '456',
            str2: 'aaa',
            num: 32,
            num2: 14,
            obj: {
                bool: true,
                bool2: false,
            },
            obj2: {
                bool: true,
                str: 'asd',
            },
        });
    });

});

import { buildOutput, inputJson, outputJson } from '@yakubique/atils/dist';
import * as core from '@actions/core';
import { ActionInputs, getInputs } from './io-helper';
import pLimit from 'p-limit';
import fetch, { Headers, Request, Response } from 'node-fetch';

enum Outputs {
    result = 'result',
}

const setOutputs = buildOutput(Outputs);

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchRetry(req: Request, retry: number, retryPause: number): Promise<Response | undefined> {
    while (retry > 0) {
        try {
            const response = await fetch(req.url, req);

            if (response.status !== 200) {
                throw Error('429');
            }

            return response
        } catch (e: any) {
            retry = retry - 1;
            if (retry === 0) {
                // throw e;
                core.info(e.toString());
                return undefined; //@todo: make optional
            }

            if (retryPause) {
                core.info('pausing..');
                await sleep(retryPause);
                core.info('done pausing...');
            }
        }
    }
}

async function grabOne(url: string, headers: Headers, method: string, retryCount: number, retryPause: number, interval: number) {
    const response = await fetchRetry({
        url,
        headers,
        method
    } as Request, retryCount, retryPause);

    if (!response) {
        core.info(`No response for ${url}`);
        return undefined;
    }

    try {
        const result = await response.json();

        if (interval) {
            await sleep(interval);
        }

        return result;
    } catch (e) {
        if (interval) {
            await sleep(interval);
        }
        core.info('JSON error');
        return undefined;
    }
}

(async function run() {
    try {
        const inputs: ActionInputs = getInputs();
        const endpoints: string[] = inputJson(inputs.endpoints, inputs.fromFile);

        if (endpoints.length === 0) {
            return setOutputs({ result: outputJson([], inputs.toFile) });
        }

        const headers = JSON.parse(inputs.headers);

        const limit = pLimit(inputs.concurrency);

        const result = await Promise.all(
            endpoints.map((endpoint) => limit(
                grabOne,
                endpoint, headers, inputs.method, inputs.retry, inputs.retryPause, inputs.interval
            ))
        );

        setOutputs({
            result: outputJson(result.filter(Boolean), inputs.toFile)
        });

        core.info('Success!');
    } catch (err: any) {
        core.setFailed(err.message);
    }
})();

import { getNumberInput, getOptional, getBooleanInput } from '@yakubique/atils/dist';
import * as core from '@actions/core';

enum Inputs {
    Interval = 'interval',
    Endpoints = 'endpoints',
    Method = 'method',
    Headers = 'headers',
    RetryPause = 'retry_pause',
    Retry = 'retry',
    ToFile = 'to_file',
    FromFile = 'from_file',
    Concurrency = 'concurrency'
}

export interface ActionInputs {
    interval: number;
    endpoints: string;
    method: string;
    headers: string;
    retry: number;
    retryPause: number;
    toFile: boolean;
    fromFile: boolean;
    concurrency: number;
}

export function getInputs(): ActionInputs {
    const result = {} as ActionInputs;

    result.interval = getNumberInput(Inputs.Interval, { required: true });
    result.endpoints = core.getInput(Inputs.Endpoints, { required: true });

    result.retryPause = getNumberInput(Inputs.RetryPause, { required: false });
    result.retry = getNumberInput(Inputs.Retry, { required: false });
    result.concurrency = getNumberInput(Inputs.Concurrency, { required: false });

    result.method = getOptional(Inputs.Method, 'GET', { required: false });
    result.headers = getOptional(Inputs.Headers, '{}', { required: false });

    result.toFile = getBooleanInput(Inputs.ToFile);
    result.fromFile = getBooleanInput(Inputs.FromFile);

    return result;
}

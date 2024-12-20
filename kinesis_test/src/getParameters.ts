import { SSMClient, GetParameterCommand, GetParametersCommand } from '@aws-sdk/client-ssm';

// Initialize SSM client
const ssmClient = new SSMClient({ region: "us-east-2" }); 

/**
 * Retrieve a single parameter by name.
 * @param parameterName The name of the parameter to retrieve.
 * @param withDecryption Whether to decrypt secure strings.
 */
export const getParameter = async (parameterName: string, withDecryption: boolean = false): Promise<string | undefined> => {
    try {
        const command = new GetParameterCommand({
            Name: parameterName,
            WithDecryption: withDecryption,
        });
        const response = await ssmClient.send(command);
        return response.Parameter?.Value;
    } catch (error) {
        console.error(`Error fetching parameter ${parameterName}:`, error);
        return undefined;
    }
};

/**
 * Retrieve multiple parameters by names.
 * @param parameterNames An array of parameter names to retrieve.
 * @param withDecryption Whether to decrypt secure strings.
 */
export const getParameters = async (parameterNames: string[], withDecryption: boolean = false): Promise<Record<string, string>> => {
    try {
        const command = new GetParametersCommand({
            Names: parameterNames,
            WithDecryption: withDecryption,
        });
        const response = await ssmClient.send(command);
        const parameters: Record<string, string> = {};
        response.Parameters?.forEach(param => {
            if (param.Name && param.Value) {
                parameters[param.Name] = param.Value;
            }
        });
        return parameters;
    } catch (error) {
        console.error("Error fetching parameters:", error);
        return {};
    }
};


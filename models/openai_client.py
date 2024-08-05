from azure.identity import DefaultAzureCredential, get_bearer_token_provider
from openai import AzureOpenAI

def client_creator():
    AZURE_OPENAI_SERVICE = "oai-cedi-ds-swc-dev"
    azure_credential = DefaultAzureCredential()
    token_provider = get_bearer_token_provider(azure_credential, "https://cognitiveservices.azure.com/.default")
    client = AzureOpenAI(
        azure_endpoint=f"https://{AZURE_OPENAI_SERVICE}.openai.azure.com",
        api_version="2024-02-15-preview",
        azure_ad_token_provider=token_provider,
    )
    return client
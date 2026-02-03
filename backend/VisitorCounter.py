import boto3
import json
from decimal import Decimal

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('VisitorCount')

# Converts DynamoDB Decimal objects to regular int/float
def convert_decimals(obj):
    if isinstance(obj, list):
        return [convert_decimals(i) for i in obj]
    elif isinstance(obj, dict):
        return {k: convert_decimals(v) for k, v in obj.items()}
    elif isinstance(obj, Decimal):
        return int(obj) if obj % 1 == 0 else float(obj)
    else:
        return obj

def lambda_handler(event, context):
    try:
        response = table.update_item(
            Key={'id': 'visitor-count'},
            UpdateExpression="ADD #count :val",
            ExpressionAttributeNames={'#count': 'count'},
            ExpressionAttributeValues={':val': 1},
            ReturnValues="UPDATED_NEW"
        )
        
        new_count = int(response['Attributes']['count'])

        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': 'https://cloudcrafted.dev',
                'Access-Control-Allow-Methods': 'GET,OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            'body': json.dumps({'count': new_count})
        }
    except Exception as e:
        print(f"Error: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {
                'Access-Control-Allow-Origin': 'https://cloudcrafted.dev'
            },
            'body': json.dumps({'error': 'Could not update visitor count'})
        }

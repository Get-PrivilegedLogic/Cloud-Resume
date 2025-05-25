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
    response = table.get_item(Key={'id': 'visitor-count'})
    item = response.get('Item', {'id': 'visitor-count', 'count': 0})
    
    current_count = int(item['count']) if isinstance(item['count'], Decimal) else item['count']
    new_count = current_count + 1

    table.put_item(Item={'id': 'visitor-count', 'count': new_count})

    return {
        'statusCode': 200,
        'headers': {
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({'count': convert_decimals(new_count)})
    }

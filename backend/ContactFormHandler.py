import boto3
import json
import os

ses = boto3.client('ses', region_name='us-east-1')

def lambda_handler(event, context):
    print("=== Raw Event Received ===")
    print(json.dumps(event))

    try:
        body = event.get('body')
        if not body:
            raise ValueError("Missing 'body' in event.")

        try:
            data = json.loads(body)
        except Exception as json_error:
            raise ValueError(f"Could not parse JSON body: {json_error}")

        name = data.get('name', 'No Name')
        email = data.get('email', 'No Email')
        message = data.get('message', 'No Message')

        print(f"Parsed Data: name={name}, email={email}, message={message}")

        response = ses.send_email(
            Source=os.environ['FROM_EMAIL'],
            Destination={'ToAddresses': [os.environ['TO_EMAIL']]},
            Message={
                'Subject': {'Data': f'Contact Form Submission from {name}'},
                'Body': {'Text': {'Data': f"From: {name} <{email}>\n\n{message}"}}
            }
        )

        print("=== Email sent ===")
        return {
            'statusCode': 200,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'message': 'Email sent successfully'})
        }

    except Exception as e:
        print("=== Lambda Error ===")
        print(str(e))
        return {
            'statusCode': 500,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)})
        }

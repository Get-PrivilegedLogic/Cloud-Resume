import json
import urllib.request

def lambda_handler(event, context):
    try:
        with urllib.request.urlopen("http://api.open-notify.org/iss-now.json") as response:
            result = json.loads(response.read().decode("utf-8"))

        if result["message"] != "success":
            raise Exception("API call unsuccessful")

        position = result["iss_position"]
        return {
            "statusCode": 200,
            "headers": {"Access-Control-Allow-Origin": "*"},
            "body": json.dumps({
                "latitude": position["latitude"],
                "longitude": position["longitude"],
                "timestamp": result["timestamp"]
            })
        }

    except Exception as e:
        return {
            "statusCode": 500,
            "headers": {"Access-Control-Allow-Origin": "*"},
            "body": json.dumps({"error": str(e)})
        }

import json
import os
import time
import pprint
from flask import Flask, Response, request, render_template

app = Flask(__name__, static_url_path='', static_folder='react_comments')
app.add_url_rule('/', 'root', lambda: app.send_static_file('index.html'))


@app.route('/api/comments', methods=['GET', 'POST', 'DELETE'])
def comments_handler():
    with open('comments.json', 'r') as f:
        comments = json.loads(f.read())

    if request.method == 'POST':
        new_comment = request.form.to_dict()
        new_comment['id'] = int(time.time() * 1000)
        comments.append(new_comment)

        with open('comments.json', 'w') as f:
            f.write(json.dumps(comments, indent=4, separators=(',', ': ')))

    if request.method == 'DELETE':
        del_comment_id = int(request.form.to_dict()['id'])
        for comment in comments:
            if comment['id'] == del_comment_id:
                comments.remove(comment)
        with open('comments.json', 'w') as f:
            f.write(json.dumps(comments, indent=4, separators=(',', ': ')))


    return Response(
        json.dumps(comments),
        mimetype='application/json',
        headers={
            'Cache-Control': 'no-cache',
            'Access-Control-Allow-Origin': '*'
        }
    )

@app.route('/')
def index():
    return render_template('index.html')

if __name__ == '__main__':
    app.run(port=int(os.environ.get("PORT", 3000)), debug=True)

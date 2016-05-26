var CommentBox = React.createClass({
  getInitialState: function() {
    return {data: []};
  },
  
  // загрузка данных с сервера (использование jquery - плохой тон)
  loadCommentsFromServer: function() {
    $.ajax({
      url: this.props.url,
      dataType: 'json',
      type: 'GET',
      success: function(data) {
        this.setState({data: data});
      }.bind(this),
      error: function(xhr, status, err) {
        console.error(this.props.url, status, err.toString());
      }.bind(this)
    });
  },

  // принимает данные коментария из свойства onCommentSubmit дочернего компонента
  handleCommentSubmit: function(comment) {
    var comments = this.state.data;

    // добавляем коментарию временное id
    comment.id = Date.now();

    var newComments = comments.concat([comment]);
    this.setState({
      data: newComments
    });

    // отправка нового коментария на сервер
    $.ajax({
      url: this.props.url,
      dataType: 'json',
      type: 'POST',
      data: comment,
      success: function(data) {
        this.setState({data: data});
      }.bind(this),
      error: function(xhr, status, err) {
        this.setState({data: comments});
        console.error(this.props.url, status, err.toString());
      }.bind(this)
    });
  },

  handleCommentDelete: function(commentId) {
    // переменная с комментариями
    // которая будет использоваться для моментального изменения
    // списка комментариев
    var commentsForChange = this.state.data;

    // если что-то пойдет не так при отправке delete запроса
    // эти комментарии будут добавлены в состояние
    var comments = this.state.data;

    for (var i = 0; i< commentsForChange.length; i++) {
      if (commentsForChange[i]['id'] == commentId) {
        commentsForChange.splice(i, 1);
      }
    }

    // заменяем состояние без комментриев которые были удалены
    this.setState({
      data: commentsForChange
    });

    $.ajax({
      url: this.props.url,
      type: 'DELETE',
      data: {"id": commentId},
      success: function(data) {
        //console.log('success');
      }.bind(this),
      error: function(xhr, status, err) {
        // при ошибке возвращаем старые комментарии
        this.setState({
          data: comments
        });
        console.error(this.props.url, status, err.toString());
      }.bind(this)
    });
  },

  // при создании компонента загружаем данные
  componentDidMount: function() {
    this.loadCommentsFromServer();
  },

  render: function() {
    return (
      <div className="commentBox row">
      <div className="col-md-6 col-md-offset-3">
        <h3>Comments</h3>
        <CommentList data={this.state.data} onCommentDelete={this.handleCommentDelete} />
        <h3 className="text-center">Post your comment</h3>
        <CommentForm onCommentSubmit={this.handleCommentSubmit} />
      </div>
      </div>
    );
  }
});


var CommentList = React.createClass({
  handleDelete: function(commentId) {
    return this.props.onCommentDelete(commentId);
  },

  render: function() {
    var commentNodes = this.props.data.map(function(comment) {
      return (
        <Comment comment={comment} key={comment.id} onDelete={this.handleDelete}>
          {comment.text}
        </Comment>
      );
    }.bind(this));

    return (
      <div className="commentList">
        {commentNodes}
      </div>
    );
  }
});


var CommentForm = React.createClass({
  getInitialState: function() {
    return {author: '', text: '', datetime: ''};
  },

  handleAuthorChange: function(e) {
    this.setState({author: e.target.value});
  },

  handleTextChange: function(e) {
    this.setState({text: e.target.value});
  },

  // выполняется при подтверждении формы
  handleSubmit: function(e) {
    e.preventDefault();
    var author = this.state.author.trim();
    var text = this.state.text.trim();
    var datetime = new Date;

    // настроки даты
    var options = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    };

    // редактирование даты
    datetime = datetime.toLocaleString("en-US", options);

    // если не указан текст или автор, просто выходим из ф-ции
    if (!text || !author) {
      return;
    }

    // отправляем данные коментария родительскому компоненту
    this.props.onCommentSubmit({author: author, text: text, datetime: datetime});
    this.setState({author: '', text: '', datetime: ''});
  },

  render: function() {
    return (
      <form className="commentForm form" onSubmit={this.handleSubmit}>
        <input className="form-control border-input" type="text" placeholder="Name" value={this.state.author} onChange={this.handleAuthorChange} /><br />
        <textarea className="form-control border-input" type="text" placeholder="Message" value={this.state.text} onChange={this.handleTextChange} rows="6" />
        <div className="media-footer">
          <input className="btn btn-fill btn-info" type="submit" value="Post" />
        </div>
        
      </form>
    );
  }
});


var Comment = React.createClass({
  // функция нужна для предоставления возможности
  // испольновать markup разметку в комментариях
  // которая превращается в html тэги
  // для развешения html тегов указано sanitize: true
  rawMarkup: function() {
    var rawMarkup = marked(this.props.children.toString(), {sanitize: true});
    return {__html: rawMarkup};
  },

  handleDeleteClick: function() {
    var commentId = this.props.comment.id;
    return this.props.onDelete(commentId);
  },

  render: function() {
    return (
      <div className="media">
        <div className="pull-left">
          <div className="avatar">
            <img className="media-object" src="img/new_logo.png" />
          </div>
        </div>
        <div className="comment media-body">
          <h5 className="commentAuthor media-heading">
            {this.props.comment.author}
          </h5>
          <div className="pull-right"><button href="#" className="btn btn-simple" onClick={this.handleDeleteClick}>X</button></div>
          <p><span dangerouslySetInnerHTML={this.rawMarkup()} /></p>
          <div className="media-footer">
              <h6 className="text-muted pull-right">{this.props.comment.datetime}</h6>
          </div>
        </div>
      </div>
    );
  }
});


ReactDOM.render(
  <CommentBox url="/api/comments" pollInterval={2000}/>,
  document.getElementById('content')
);
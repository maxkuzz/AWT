import Mustache from "./mustache.js";
import processOpnFrmData from "./addOpinion.js";
import articleFormsHandler from "./articleFormsHandler.js";

//an array, defining the routes
export default[
    {
        //the part after '#' in the url (so-called fragment):
        hash:"welcome",
        ///id of the target html element:
        target:"router-view",
        //the function that returns content to be rendered to the target html element:
        getTemplate:(targetElm) =>
            document.getElementById(targetElm).innerHTML = document.getElementById("template-welcome").innerHTML
    },
    {
      //the part after '#' in the url (so-called fragment):
      hash:"course",
      ///id of the target html element:
      target:"router-view",
      //the function that returns content to be rendered to the target html element:
      getTemplate:(targetElm) =>
          document.getElementById(targetElm).innerHTML = document.getElementById("template-course").innerHTML
   },  
   {
    //the part after '#' in the url (so-called fragment):
    hash:"diet",
    ///id of the target html element:
    target:"router-view",
    //the function that returns content to be rendered to the target html element:
    getTemplate:(targetElm) =>
        document.getElementById(targetElm).innerHTML = document.getElementById("template-diet").innerHTML
  }, 
  {
  //the part after '#' in the url (so-called fragment):
  hash:"advice",
  ///id of the target html element:
  target:"router-view",
  //the function that returns content to be rendered to the target html element:
  getTemplate:(targetElm) =>
      document.getElementById(targetElm).innerHTML = document.getElementById("template-advice").innerHTML
  }, 
    {
        hash:"articles",
        target:"router-view",
        getTemplate: fetchAndDisplayArticles
    },
    {
        hash:"opinions",
        target:"router-view",
        getTemplate: createHtml4opinions
    },
    {
        hash:"addOpinion",
        target:"router-view",
        getTemplate: (targetElm) =>{
            document.getElementById(targetElm).innerHTML = document.getElementById("template-addOpinion").innerHTML;
            document.getElementById("opnFrm").onsubmit=processOpnFrmData;
        }
    },
    {
        hash:"article",
        target:"router-view",
        getTemplate: fetchAndDisplayArticleDetail
    },
    {
        hash:"artEdit",
        target:"router-view",
        getTemplate: editArticle
    },
    {
        hash:"artDelete",
        target:"router-view",
        getTemplate: deleteArticle
    },
    {
        hash: "addArticle",
        target: "router-view",
        getTemplate: renderAddArticlePage
    }
    
];

const urlBase = "https://wt.kpi.fei.tuke.sk/api";
const articlesPerPage = 20;

function createHtml4opinions(targetElm){
    const opinionsFromStorage=localStorage.myTreesComments;
    let opinions=[];

    if(opinionsFromStorage){
        opinions=JSON.parse(opinionsFromStorage);
        opinions.forEach(opinion => {
            opinion.created = (new Date(opinion.created)).toDateString();
            opinion.willReturn = 
              opinion.willReturn?"I will return to this page.":"Sorry, one visit was enough.";
        });
    }

    document.getElementById(targetElm).innerHTML = Mustache.render(
        document.getElementById("template-opinions").innerHTML,
        opinions
        );
} 

function fetchAndDisplayArticles(targetElm, offsetFromHash, totalCountFromHash) {
  const offset = Number(offsetFromHash) || 0;
  const totalCount = Number(totalCountFromHash) || 0;
  const maxPerPage = articlesPerPage;
  // const tagFilter = "anime"; 
  // const url = `${urlBase}/article?offset=${offset}&max=${maxPerPage}&tag=${tagFilter}`;

    const url = `${urlBase}/article?offset=${offset}&max=${maxPerPage}`;


    function reqListener() {
      if (this.status === 200) {
        const responseJSON = JSON.parse(this.responseText);
        addArtDetailLink2ResponseJson(responseJSON);
  
        const totalPages = Math.ceil(responseJSON.meta.totalCount / maxPerPage);
        const currentPage = Math.floor(offset / maxPerPage) + 1;
  
        const templateData = {
          articles: responseJSON.articles,
          totalPages,
          currentPage,
          hasPrevPage: offset > 0,
          hasNextPage: offset + maxPerPage < totalCount,
        };
        
        document.getElementById(targetElm).innerHTML = Mustache.render(
          document.getElementById("template-articles").innerHTML,
          templateData
        );

        const prevPageButton = document.getElementById("prevPage");
        const nextPageButton = document.getElementById("nextPage");
        
        prevPageButton.addEventListener("click", () => {
          const newOffset = offset - maxPerPage;
          window.location.href = `#articles/${newOffset}/${totalCount}`;
        });
  
        nextPageButton.addEventListener("click", () => {
          const newOffset = offset + maxPerPage;
          window.location.href = `#articles/${newOffset}/${totalCount}`;
        });
  
        prevPageButton.style.display = currentPage > 1 ? "" : "none";
        nextPageButton.style.display = currentPage < totalPages ? "" : "none";
      } else {
        const errMsgObj = { errMessage: this.responseText };
        document.getElementById(targetElm).innerHTML = Mustache.render(
          document.getElementById("template-articles-error").innerHTML,
          errMsgObj
        );
      }
    }
  
    var ajax = new XMLHttpRequest();
    ajax.addEventListener("load", reqListener);
    ajax.open("GET", url, true);
    ajax.send();
  }

function addArtDetailLink2ResponseJson(responseJSON){
    responseJSON.articles = responseJSON.articles.map(
      article =>(
       {
         ...article,
         detailLink:`#article/${article.id}/${responseJSON.meta.offset}/${responseJSON.meta.totalCount}`
       }
      )
    );
  } 

  function fetchAndDisplayArticleDetail(targetElm,artIdFromHash,offsetFromHash,totalCountFromHash) {
   
    fetchAndProcessArticle(...arguments,false);
}         

function fetchAndProcessArticle(targetElm, artIdFromHash, offsetFromHash, totalCountFromHash, forEdit) {
  const url = `${urlBase}/article/${artIdFromHash}`; 
 
  function reqListener() {
    if (this.status == 200) {
      const responseJSON = JSON.parse(this.responseText);
      // Retrieve comments from the server
      const commentsLink = document.createElement('a');
      commentsLink.textContent = 'View Comments';
      commentsLink.href = `#artComment/${artIdFromHash}`;
      document.getElementById(targetElm).appendChild(commentsLink);
    

      responseJSON.comments = JSON.parse(localStorage.getItem(`comments_${artIdFromHash}`)) || []
      if (forEdit) {
      //  responseJSON.formTitle = "Article Edit";
        responseJSON.submitBtTitle = "Save article";
        responseJSON.backLink = `#article/${artIdFromHash}/${offsetFromHash}/${totalCountFromHash}`;

        document.getElementById(targetElm).innerHTML =
          Mustache.render(
            document.getElementById("template-article-form").innerHTML,
            responseJSON
          );

        if (!window.artFrmHandler) {
          window.artFrmHandler = new articleFormsHandler("https://wt.kpi.fei.tuke.sk/api");
        }

        window.artFrmHandler.assignFormAndArticle("articleForm", "hiddenElm", artIdFromHash, offsetFromHash, totalCountFromHash);
      } else {
        responseJSON.backLink = `#articles/${offsetFromHash}/${totalCountFromHash}`;
        responseJSON.editLink = `#artEdit/${responseJSON.id}/${offsetFromHash}/${totalCountFromHash}`;
        responseJSON.deleteLink = `#artDelete/${responseJSON.id}/${offsetFromHash}/${totalCountFromHash}`;

        document.getElementById(targetElm).innerHTML =
          Mustache.render(
            document.getElementById("template-article").innerHTML,
            responseJSON
          );

        const addCommentButton = document.getElementById("addCommentBtn");
        const commentForm = document.getElementById("commentForm");

        addCommentButton.addEventListener("click", () => {
          addCommentButton.style.display = "none";
          commentForm.style.display = "block";
        });

        const submitComment = document.getElementById("submitComment");

        submitComment.addEventListener("click", () => {
          const commenter = document.getElementById("commenter").value;
          const comment = document.getElementById("comment").value;

          if (commenter && comment) {
            responseJSON.comments.push({ commenter, comment });
            localStorage.setItem(`comments_${artIdFromHash}`, JSON.stringify(responseJSON.comments));

            commentForm.style.display = "none";
            renderComments(document.getElementById("commentsSection"), responseJSON);
          }
        });

        const commentsSection = document.getElementById("commentsSection");
        renderComments(commentsSection, responseJSON);

        fetch(`${urlBase}/article/${artIdFromHash}/comment`)
        .then((commentsResponse) => commentsResponse.json())
        .then((commentsJSON) => {
          responseJSON.comments = commentsJSON.comments;

          // Render article and comments
          renderArticleAndComments(responseJSON, targetElm, forEdit, artIdFromHash, offsetFromHash, totalCountFromHash);
        })
        .catch((error) => {
          console.error("Failed to fetch comments:", error);
          // If fetching comments fails, render article without comments
          renderArticleAndComments(responseJSON, targetElm, forEdit, artIdFromHash, offsetFromHash, totalCountFromHash);
        });
      }
      
    } else {
      const errMsgObj = { errMessage: this.responseText };
      document.getElementById(targetElm).innerHTML =
        Mustache.render(
          document.getElementById("template-articles-error").innerHTML,
          errMsgObj
        );
    }
  }
  function setupAddCommentButton(responseJSON) {
    const addCommentButton = document.getElementById("addCommentBtn");
  
    addCommentButton.addEventListener("click", () => {
      addCommentButton.style.display = "none";
      document.getElementById("commentForm").style.display = "block";
    });
  }

  function setupSubmitCommentButton(responseJSON) {
    const submitCommentButton = document.getElementById("submitComment");
  
    submitCommentButton.addEventListener("click", () => {
      const commenter = document.getElementById("commenter").value;
      const commentText = document.getElementById("comment").value;
  
      if (commenter && commentText) {
        const newComment = {
          author: commenter,
          text: commentText,
        };
  
        fetch(`${urlBase}/article/${responseJSON.id}/comment`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(newComment),
        })
          .then((response) => response.json())
          .then((newComment) => {
            responseJSON.comments.push(newComment);
  
            const commentsSection = document.getElementById("commentsSection");
            renderComments(commentsSection, responseJSON, 1);
          })
          .catch((error) => {
            console.error("Failed to add comment:", error);
          });
      }
    });
  }
  
  function renderComments(commentsSection, responseJSON, page) {
    const commentsPerPage = 10;
    const totalComments = responseJSON.comments.length;
    let totalPages = Math.ceil(totalComments / commentsPerPage);
    if (totalPages<1) {
      totalPages = 1;
    }
    // Validate and set the current page
    page = Math.max(1, Math.min(page, totalPages));
    
    const startIndex = (page - 1) * commentsPerPage;
    const endIndex = Math.min(startIndex + commentsPerPage, totalComments);
    const paginatedComments = responseJSON.comments.slice(startIndex, endIndex);
  
    commentsSection.innerHTML = Mustache.render(
      '<h4>Comments</h4>{{#comments}}<div><h2>Created by: {{author}}</h2><p>{{text}}</p></div>{{/comments}}' +
        '<button id="addCommentBtn">Add Comment</button><br>' +
      '<div id="commentForm" style="display: none;"><form id="commentForm">' +
      '<label for="commenter">Your Name:</label><input type="text" id="commenter" name="commenter" required><br>' +
      '<br><label for="comment">Your Comment:</label><textarea id="comment" name="comment" rows="3" required></textarea>' +
      '<br><button type="button" id="submitComment">Submit Comment</button></form></div>',
      { comments: paginatedComments }
    );
    // В функции renderComments, после рендеринга кнопки "Add Comment":
    setupAddCommentButton(responseJSON);
      // В функции renderComments, после рендеринга содержимого комментариев:
    setupSubmitCommentButton(responseJSON);

    // Add Pagination Buttons
    const prevPageButton = document.createElement("button");
    prevPageButton.textContent = "Previous Page";
    prevPageButton.addEventListener("click", () => renderComments(commentsSection, responseJSON, page - 1));
  
    const nextPageButton = document.createElement("button");
    nextPageButton.textContent = "Next Page";
    nextPageButton.addEventListener("click", () => renderComments(commentsSection, responseJSON, page + 1));
  
    commentsSection.appendChild(prevPageButton);
    commentsSection.appendChild(document.createTextNode(` Page ${page} of ${totalPages} `));
    commentsSection.appendChild(nextPageButton);

    prevPageButton.addEventListener("click", () => renderComments(commentsSection, responseJSON, page - 1));
    nextPageButton.addEventListener("click", () => renderComments(commentsSection, responseJSON, page + 1));

    // Show/hide pagination buttons based on current page
    prevPageButton.style.display = page > 1 ? "" : "none";
    nextPageButton.style.display = page < totalPages ? "" : "none";
  }
  

  function renderArticleAndComments(responseJSON, targetElm, forEdit, artIdFromHash, offsetFromHash, totalCountFromHash) {
    document.getElementById(targetElm).innerHTML =
      Mustache.render(
        document.getElementById("template-article").innerHTML,
        responseJSON
      );
    const commentsSection = document.getElementById("commentsSection");
    renderComments(commentsSection, responseJSON, 1);
    // Add event listener for the "Add Comment" button
    document.getElementById("addCommentBtn").addEventListener("click", () => {
      document.getElementById("addCommentBtn").style.display = "none";
      document.getElementById("commentForm").style.display = "block";
    });
  }  

  var ajax = new XMLHttpRequest();
  ajax.addEventListener("load", reqListener);
  ajax.open("GET", url, true);
  ajax.send();
}


function editArticle(targetElm, artIdFromHash, offsetFromHash, totalCountFromHash) {
    fetchAndProcessArticle(...arguments,true);
}    

function deleteArticle(targetElm, artIdFromHash, offsetFromHash, totalCountFromHash) {
  const confirmDeletion = window.confirm("Are you sure you want to delete this article?");

  if (confirmDeletion) {
      const url = `${urlBase}/article/${artIdFromHash}`;

      const ajax = new XMLHttpRequest();
      ajax.addEventListener("load", () => {
          if (ajax.status === 204) { 
              console.log("Article deleted successfully");
              window.location.href = `#articles/${offsetFromHash}/${totalCountFromHash}`;
          } else {
              console.error(`Failed to delete article. Status: ${ajax.status}`);
          }
      });

      ajax.open("DELETE", url, true);
      ajax.send();
  }
}

function renderAddArticlePage(targetElm) {
    document.getElementById(targetElm).innerHTML = document.getElementById("template-addArticle").innerHTML;
    
    const articleForm = document.getElementById('articleForm');
    articleForm.addEventListener('submit', function(event) {
        event.preventDefault(); // Prevent the default form submission

        const formData = new FormData(articleForm);
            
        const articleData = {};
        formData.forEach(function(value, key){
            articleData[key] = value;
        });
        
        const tagsInput = articleData.tags;
        if (tagsInput){
          articleData.tags = tagsInput.split(', ').map(tag => tag.trim());
        }

        // Send article data to the server
        const url = 'https://wt.kpi.fei.tuke.sk/api/article';
        const ajax = new XMLHttpRequest();
        ajax.addEventListener('load', function() {
            if (ajax.status === 201) {
                console.log('Article added successfully');
                window.location.href = '#articles';
            } else {
                console.error('Failed to add article');
            }
        });
        ajax.open('POST', url);
        ajax.setRequestHeader('Content-Type', 'application/json');
        ajax.send(JSON.stringify(articleData));
    });
}
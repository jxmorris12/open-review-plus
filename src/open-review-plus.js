// jxmorris12 9/28/19

// Tiny jquery extension
// thanks /u/Magnar https://stackoverflow.com/questions/920236/how-can-i-detect-if-a-selector-returns-null

$.fn.exists = function () {
    return this.length !== 0;
}

var reviewColors = [
  '#8c1b13', //  0
  '#7b1e20', //  1
  '#6b212d', //  2
  '#5a243b', //  3
  '#4b2647', //  4
  '#41274f', //  5
  '#382856', //  6
  '#2d2a5f', //  7
  '#212c68', //  8
  '#172e70', //  9
  '#003182', // 10
];

// Show as heading for reviews that haven't been decided yet.
var placeholderDecision = 'Still pending';
var pageLoadWait = 40; // gap between tests
var drawnGraphs = false;

var scrollToOffset = function(offset) {
  /* Scrolls to an element its offset. */
  let scrollTo = offset + 'px';
  $("html, body").animate({ scrollTop: offset });
}

var scrollToReview = function(reviewNumber) {
  /* Scrolls to a review from its index in the list. */
  let reviewBoxes = $('.note_content_field:contains(Rating: )').closest('.note_with_children');
  let reviewBox = reviewBoxes[reviewNumber];
  scrollToOffset($(reviewBox).position().top);
}

var loadReviews = function() {

  /* Check if not loaded yet */
  if(drawnGraphs) {
    return;
  }
  if(document.readyState !== "complete" || $('.spinner-container').exists()) {
    setTimeout(loadReviews, pageLoadWait);
    return;
  }

  drawnGraphs = true;

  /* Once loaded, draw stuff */
  let ratings = $('.note_content_field:contains(Rating: )').next();
  var ratingTexts = [];
  var reviewerNames = [];
  ratings.get().forEach((x) => {
    let text = $(x).text();
    ratingTexts.push(text);
    let signatureBox = $(x).closest('.note.panel').find('.signatures');
    reviewerNames.push(signatureBox.text());
  });

  let ratingInts = ratingTexts.map(s => parseInt(s[0]));

  let confidences = $('.note_content_field:contains(Confidence: )').next();
  var confidenceTexts = [];
  confidences.get().forEach((x) => {
    let text = $(x).text();
    confidenceTexts.push(text);
  });

  let confidenceInts = confidenceTexts.map(s => parseInt(s[0]));

  /* Make graph. */
  // insert before .filter-row
  let graphContainer = $('<div class="graph-container"></div>');
  if($('.filter-row').exists()) {
    // This is the anchor element for pages with reviews.
    $('.filter-row').before(graphContainer);
  } else {
    // This is the anchor element for pages with no reviews.
    $('.reply_row').before(graphContainer);
    graphContainer.before('<br><hr>');
  }

  // add header and final decision
  let finalDecision = undefined;
  if($('.note_content_field:contains(Decision: )').exists()) {
    finalDecision = $('.note_content_field:contains(Decision: )').next().text();
  } else if($('.note_content_field:contains(Recommendation: )').exists()) {
    finalDecision = $('.note_content_field:contains(Recommendation: )').next().text();
  }
  finalDecision = finalDecision || placeholderDecision;

  graphContainer.append(`<div class="final-decision"><p>Decision:</p><br><p id="decision-text">${finalDecision}</p>`);
  // color final decision
  if(finalDecision == 'Reject') {
    $('#decision-text').css('color', 'maroon');
  } else if(finalDecision == 'Accept' || finalDecision == 'Accept (Oral)') {
    $('#decision-text').css('color', 'green');
  }

  // create container for reviews (right column)
  let reviewContainer = $('<div class="review-container"></div>');
  graphContainer.append(reviewContainer);
  reviewContainer.append('<p id="reviews-title">Reviews:</p>');
  // add ratings bars
  for(let i = 0; i < ratingTexts.length; i++) {
    let reviewBox = $(`<div class="review-box" id="review-box-${i}"></div>`);
    // Review text for reviewer name, score, and confidence.
    let reviewText = `<span class="reviewer-name">${reviewerNames[i]}</span>`;
    reviewText += `<span class="review-num">${ratingInts[i]}</span>`;
    reviewText += `<span class="review-confidence">(Confidence: ${confidenceInts[i]})</span>`;
    reviewBox.append(`<p class="review-text" id="review-text-${i}">${reviewText}</p>`);
    // bar to show review and confidence visually.
    let reviewBarBox = $('<div class="review-bar-box"></div>');
    reviewBarBox.append('<div class="review-bar-outer" id="review-bar-outer-' + i + '"><div class="review-bar" id="review-bar-' + i + '"></div></div>');
    reviewBox.append(reviewBarBox);
    // Add box for text and bar.
    reviewContainer.append(reviewBox);
    // Set bar color.
    $('#review-bar-' + i).css('background', reviewColors[parseInt(ratingInts[i])]);
    // Add scrollTo.
    reviewBox.click(() => scrollToReview(i));
  }
  if(ratingTexts.length === 0) {
    reviewContainer.append('<p id="no-reviews">No reviews yet.</p>')
  }

  // bar opacity - max confidence is 5
  // opacity 0 is darker
  for(let i = 0; i < confidenceInts.length; i++) {
    let opacity = (confidenceInts[i])/4.0;
    let color = opacity;
    $('#review-bar-' + i).css('opacity', opacity);
  }

  // bar length - max review is 10
  for(let i = 0; i < ratingInts.length; i++) {
    let thisBar = $('#review-bar-' + i);
    let originalBarWidth = thisBar.width();
    let newBarWidth = ratingInts[i]/10.0 * originalBarWidth;
    thisBar.width(newBarWidth);
  }

  // Some final padding.
  graphContainer.before('<br>');
  graphContainer.after('<br><hr style="height:2px">');
}

loadReviews();
$(window).on('load', loadReviews, false);

const BASE_URL = 'https://api.harvardartmuseums.org';
const KEY = 'apikey=d136828a-ca38-49f8-89ff-cdaf99216dc4'; // USE YOUR KEY HERE

async function fetchObjects() {
    const url = `${ BASE_URL }/object?${ KEY }`;
  
    try {
      const response = await fetch(url);
      const data = await response.json();
  
      return data;
    } catch (error) {
      console.error(error);
    }
  }
  
  fetchObjects().then(x => console.log(x));



  async function fetchAllCenturies() {
      const url = `${ BASE_URL }/century?${ KEY }&size=100&sort=temporalorder`;

      if (localStorage.getItem('centuries')) {
        return JSON.parse(localStorage.getItem('centuries'));
      };

      try {
          const response = await fetch(url);
          const data = await response.json();
          const records = data.records;

          return records;
      } catch (error) {
          console.errror(error);
    }
};

async function fetchAllClassifications () {
    const url = `${ BASE_URL }/classification?${ KEY }&size=100&sort=name`;

      if (localStorage.getItem('classifications')) {
        return JSON.parse(localStorage.getItem('classifications'));
      };

      try {
          const response = await fetch(url);
          const data = await response.json();
          const records = data.records;

          return records;
      } catch (error) {
          console.errror(error);
    }
};


async function prefetchCategoryLists() {
    try {
      const [
        classifications, centuries
      ] = await Promise.all([
        fetchAllClassifications(),
        fetchAllCenturies()
      ]);
      //   This provides a clue to the user, that there are items in the dropdown
    $('.classification-count').text(`(${ classifications.length })`);

    classifications.forEach(classification => {
         $('#select-classification').append(
        `<option value="${classification.name}">${classification.name}</option>`)
    });

    // This provides a clue to the user, that there are items in the dropdown
    $('.century-count').text(`(${ centuries.length })`);

    centuries.forEach(century => {
        $('#select-century').append(
            `<option value="${century.name}">${century.name}</option>`)
        });
    } catch (error) {
      console.error(error);
    }
  }

  prefetchCategoryLists();


  
  function buildSearchString() {
    let classification = $('#select-classification').val();
    let century = $('#select-century').val();
    let keyword = $('#keywords').val();


    return `${ BASE_URL }/object?${ KEY }&classification=${classification}&century=${century}&keyword=${keyword}`
  }



  $('#search').on('submit', async function (event) {
    onFetchStart();
    event.preventDefault();

    const url = buildSearchString();
    const encodedUrl = encodeURI(url);
  
    try {
      const response = await fetch(encodedUrl);
      const data = await response.json();
      const records = data.records;
      const info = data.info;

      console.log(info);
      console.log(records);

      updatePreview(records, info);

    } catch (error) {
      console.error(error)
    } finally {
        onFetchEnd();
      }
  });


  function onFetchStart() {
    $('#loading').addClass('active');
  }
  
  function onFetchEnd() {
    $('#loading').removeClass('active');
  }



  function renderPreview(record) {
    const description = record.description ? record.description : '';
    const imageUrl = record.primaryimageurl ? record.primaryimageurl : '';
    const title = record.title ? record.title : '';

   
    
    return $(`<div class="object-preview">
            <a href="#">
                <img src="${imageUrl}" />
                <h3>${title}</h3>
                <h3>${description}</h3>
            </a>
        </div>`).data('record', record);
}
  
  
  function updatePreview(records, info) {
    const preview = $('#preview');

    if(info.next) {
      $('.next').data('url', info.next)
        .attr('disabled', false)
      } else {
      $('.next').data('url', null)
      .attr('disabled', true)
    }

    if(info.prev) {
      $('.previous').data('url', info.prev)
        .attr('disabled', false)
      } else {
      $('.previous').data('url', null)
      .attr('disabled', true)
    }

    const results = $('.results');
    results.empty();

    records.forEach(record => results.append(
        renderPreview(record)));
}



$('#preview .next, #preview .previous').on('click', async function () {
  onFetchStart();  

    const url = $(this).data('url');

    try {
    const response = await fetch(url);
    const data = await response.json();
    const records = data.records;
    const info = data.info;

    updatePreview(records, info);

    } catch (error){
      console.error(error);
    } finally {
    onFetchEnd();
    }
});



$('#preview').on('click', 'a', function (event) {
  event.preventDefault(); 
  
  const record = $(this).closest('.object-preview').data('record');

  console.log('look here', record);

  $('#feature').html(renderFeature(record));
  
});



function renderFeature(record) {

  const {
    title,
    dated,
    description,
    style,
    culture,
    technique,
    medium,
    dimensions,
    department,
    division,
    contact,
    creditline,
    images,
    primaryimageurl,
  } = record;
  
  return $(`<div class="object-feature">
  <header>
    <h3>${title}</h3>
    <h4>${dated}</h4>
  </header>
  <section class="facts">
  ${ factHTML("Description", description) }
  ${ factHTML("Culture", culture, 'culture') }
  ${ factHTML("Style", style) }
  ${ factHTML("Technique", technique, 'technique') }
  ${ factHTML("Medium", medium, 'medium') }
  ${ factHTML("Dimensions", dimensions) }
  ${
    record.people
    ? record.people.map(person => {
        return factHTML('Person', person.displayname, 'person');
      }).join('')
    : ''
  }
  ${ factHTML("Department", department) }
  ${ factHTML("Division", division) }
  ${ factHTML("Contact", `<a target="_blank" href="mailto:${ contact }">${ record.contact }</a>`) }
  ${ factHTML("Credit Line", creditline) }
  </section>
  <section class="photos">
  ${ photosHTML(images, primaryimageurl) }
  </section>
</div>`);
}


function searchURL(searchType, searchString) {
  return `${ BASE_URL }/object?${ KEY }&${ searchType}=${ searchString }`;
}


function factHTML(title, content, searchTerm = null) {
  if(content === "" || undefined) {
    return "";
  }
  return `<span class="title">${ title }</span>
    <span class="content">${searchTerm && content ? `<a href="${ BASE_URL }/object?${ KEY }">${ content }</a>` : content }
    </span>`
}


function photosHTML(images, primaryimageurl) {

  if(images.length > 0) {
    return images.map(image => `<img src="${image.baseimageurl}" />`).join('');
  } else if (primaryimageurl) {
    return `<img src="${primaryimageurl}" />`
  } else {
    return '';
  }
}



$('#feature').on('click', 'a', async function (event) {
  const href = $(this).attr('href');
  if (href.startsWith('mailto')) { return; }
  event.preventDefault();

  onFetchStart();

  try {
    const response = await fetch(href);
    const { records, info } = await response.json();
    updatePreview(records, info);

  } catch (error) {
    console.error(error)
  } finally {
      onFetchEnd();
    }
});



const dayjs = require('dayjs'); // Import dayjs library
// console.log("Converted Date:", formattedDate);
function date(x){
  let formattedDate = dayjs.unix(x).format('MMMM DD, YYYY');
  return formattedDate
}
module.exports={date}

// Common Indian first names and surnames, used to read a first name out of joined-up email addresses
// like "chetanavyas1974" -> "Chetana". All lowercase. Add more any time; one space between names.

const FIRST = `
aadhya aakanksha aakriti aanchal aaradhya aarohi aarti aarushi aashi aashna aastha aayushi abha aditi adya aishwarya
akanksha akriti alka alisha alpa alpana amisha amita amrita amruta anamika anandi ananya anisha anita anjali anjana
anju ankita anshika anuja anupama anuradha anushka anvi aparna archana arpita arti aruna aruni asha ashwini avani
avantika ayesha babita bhagyashree bhakti bhamini bharti bhavana bhavika bhavna bhoomi bhumi bijal bindu binal bina
charu chandni chandrika chhaya chaitali chaitanya chetana chetna chhavi damini darshana darshini deepa deepali
deepika deepti devanshi devika devyani dhara dharti dhriti dhruvi dimple disha divya diya drashti drishti ekta esha
falguni garima gauri gayatri geeta geetanjali geetika gita gunjan hansa hansika harshada harshita heena heer hema
hemali hetal himani hina hiral ira isha ishani ishika ishita jagruti jahnavi janaki janhavi jasmine jaya jayshree
jhanvi jigna jinal juhi jyoti jyotsna kajal kalpana kamala kamini kanchan kanika karishma kashish kavita kavya
keerthi khushboo khushi khyati kinjal kiran kirti komal krina krisha krishna kriti kruti kumud kumkum kusum lata
lavanya laxmi leela lekha lipi madhavi madhu madhuri mahek mahima mallika mamta manali manasi mandakini mansi manisha
manju manjula maya meena meera megha meghna mehak minal minakshi mira mitali mithila mona monika mrudula mrunal
nainika naina namrata nandini nandita neelam neeta neha nidhi niharika nikita nilima nimisha nirali nisha nishtha
nita nitya niyati palak pallavi pankti parul pavitra payal pinal pooja poonam prachi pragati pragya prajakta
pranali pratibha pratiksha preeti prerna priya priyal priyanka puja purvi pushpa rachana radha radhika ragini rajani
rajvi rajeshwari rakhi rashmi raveena reema reena rekha renu reshma richa riddhi rina rinku risha rishika ritika
ritu riya riyanka roshni ruchi ruchita rupa rupal rupali saanvi sadhana sakshi saloni sameera sanchi sandhya sangeeta
sanika sanjana sapna sarala sarika saroj sarita saumya savita sayali seema shalini shanta sharmila sheetal shefali
shilpa shivani shobha shraddha shreya shrushti shruti shubhangi shweta simran smita sneha snehal sonal sonali sonam
sonia sudha sujata sukanya sumitra sunanda sunita supriya surbhi sushma swara swati tanisha tanushree tanvi tanya
tara tejal tejaswini trisha trupti tulsi twinkle uma urmila urvashi urvi usha vaidehi vaishali vandana varsha vasudha
vedika vibha vidhi vidya vinita vishakha yamini yashika yashvi yogita zara zoya hetvi dhwani jinali krupa nupur
aarya aditri anaya kiara myra navya pari pihu prisha sara siya tara veda vanya mahi jiya krisha samaira shanaya
aakash aarav abhay abhinav abhishek aditya ajay akash akhil akshay alok aman amit amitabh amol anand aniket anil
anirudh ankit ankur anmol anshul anuj anup arjun arnav arun arvind ashish ashok ashwin atul ayush bharat bhavesh
bhavin bhupendra chetan chintan chirag darshan deepak dev devang dhaval dhiraj dhruv dilip dinesh divyesh gaurav
gautam girish gopal harsh harshad harshil hardik hemant hitesh jatin jay jayesh jignesh kalpesh kamal karan kartik
keyur kiran kishan kishore krunal kunal lalit mahesh manan manish manoj mayank mehul mihir milan mitesh mohit mukesh
nakul naresh naveen nayan neel nikhil nilesh nirav nitin paras parth pankaj paresh piyush pradeep pranav prashant
prateek pratik pravin prem rahul raj rajan rajat rajesh rajiv rakesh ramesh ravi rishabh rohan rohit ronak sachin
sagar sahil sameer sandeep sanjay sanjeev santosh saurabh shailesh shivam shrey shubham siddharth sohan sumit sunil
suraj suresh tarun tejas tushar uday umesh varun vikas vikram vinay vinod vipul viral vishal vivek yash yogesh
`;

const SURNAMES = `
shah patel mehta vyas joshi desai trivedi pandya bhatt dave parikh modi gandhi thakkar thaker soni panchal chauhan
solanki parmar jadeja vaghela makwana rathod prajapati raval rawal upadhyay pathak shukla mishra tiwari tripathi
dubey dwivedi chaturvedi pandey sharma verma gupta agarwal aggarwal agrawal bansal goyal goel garg mittal singhal
jindal jain kapoor kapur khanna malhotra mehra arora bhatia chopra sethi kohli ahuja bajaj batra chawla dhawan gill
grover kalra luthra narang oberoi puri sachdeva sahni sawhney suri talwar tandon vohra wadhwa singh kaur sandhu sidhu
dhillon grewal bedi bhalla kumar kumari yadav chaudhary choudhary chaudhari rao reddy naidu nair menon pillai iyer
iyengar krishnan subramanian swamy gowda hegde shetty kamath bhat naik kulkarni deshpande deshmukh patil pawar jadhav
shinde gaikwad salunkhe kadam chavan bhosale bhonsle sawant rane apte gokhale khare dixit saxena srivastava
shrivastava nigam mathur bhatnagar sinha prasad dutta datta ghosh bose basu banerjee mukherjee chatterjee
bhattacharya chakraborty sengupta saha mondal mandal sarkar majumdar mitra biswas barua bora gogoi kalita hazarika
mohanty mahapatra patnaik panda sahoo sahu behera nayak jena rout khan ahmed sheikh shaikh qureshi siddiqui ansari
syed hussain mirza pathan memon kazi thakur rajput rathore shekhawat bhati tomar chandel negi rawat bisht nautiyal
pant bhandari kashyap bhardwaj vashisht mehrotra kakkar sood sareen sehgal sabharwal dhingra khurana juneja kochhar
makhija manchanda uppal walia ghai bagga varma kurian varghese fernandes dsouza desouza pereira rodrigues gomes
dcosta dsilva lobo pinto almeida kamble waghmare gupte sathe bapat kelkar ranade phadke godbole karnik vora bohra
lodha kothari oswal sanghvi sanghavi doshi sheth seth kotak vakil majmudar amin bhavsar gajjar mistry mistri shroff
randhawa bajwa brar virk cheema saini dhaliwal aulakh sekhon hundal pandit raina kaul dhar zutshi razdan koul tikoo
ojha jha choubey chaube awasthi bajpai vajpayee agnihotri katiyar kushwaha maurya chhabra gulati kathuria mahajan
nagpal pahwa chadha chaddha duggal sachdev bakshi bawa bhasin khosla malik marwah nayyar taneja vij rai roy pai
chokshi dalal kansara lakhani mehtani nanavati padia rupani shethia valand vasani zaveri jhaveri tank chudasama
gohil jhala zala dodiya baria barot brahmbhatt bhagat bhimani chheda gada savla dedhia nagda haria shastri purohit
`;

const toSet = (s) => new Set(s.trim().split(/\s+/));
module.exports = { FIRST_NAMES: toSet(FIRST), SURNAMES: toSet(SURNAMES) };

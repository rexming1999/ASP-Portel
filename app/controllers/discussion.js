var offset=0;
var args = arguments[0] || {};
var buttonsExpanded = false;
var post_index = 1;
var refreshName = args.refreshName||null;
var i_model = Alloy.createCollection("images_table");
function init(){
	offset = 0;
	Alloy.Globals.loading.startLoading("Loading...");
	addPostView();
}init();
function getData(){
	var model = Alloy.createCollection("post");
	res = model.getData(false,offset);	
	model = null;
	render_post(res);		
}
function scrollChecker(e){
	var theEnd = $.mother_view.rect.height;
	var total = (OS_ANDROID)?pixelToDp(e.y)+e.source.rect.height: e.y+e.source.rect.height;
	var nearEnd = theEnd - 200;
	if (total >= nearEnd){
		render();
	}
}
function render_post(params){
	params.forEach(function(entry){
		var imgArr = i_model.getImageByCateandPriId(true,undefined,2,entry.id);
		var container = $.UI.create("View",{classes:['view_class','vert','padding'],left:"0",right:"0",backgroundColor:"#fff",post_index:post_index});
		var title_container = $.UI.create('View',{classes:['wfill','horz'],height:68});
		var user_img = $.UI.create("ImageView",{classes:['padding'],width:45,height:45,image:"/images/user.png",u_id:entry.u_id});
		var title_child_container = $.UI.create("View",{classes:['wfill','hfill','padding'],left:0});
		var username = $.UI.create("Label",{classes:['wsize','hsize','h4','bold'],text:entry.u_name,left:"0",top:"0"});
		var time = $.UI.create("Label",{classes:['wsize','hsize','h5','grey'],left:"0",bottom:0,text:getTimePost(entry.created)});
		var more_container = $.UI.create("View",{classes:['hfill'],width:"30",right:"0",u_id:entry.u_id,p_id:entry.id,post_index:post_index});
		var more = $.UI.create("ImageView",{right:"0",top:"0",image:'/images/btn-down.png',touchEnabled:false});
		var description = $.UI.create("Label",{classes:['wfill','hsize','padding'],top:"0",text:entry.description,p_id:entry.id});
		var hr = $.UI.create("View",{classes:['hr']});
		var comment_container = $.UI.create("View",{classes:['wfill','hsize','padding']});
		var comment_count = $.UI.create("Label",{classes:['wsize','hsize','h6'],color:"#90949C",text:entry.comment_count+" comments",left:"0"});
		var comment_button_container = $.UI.create("View",{classes:['wsize','hsize','horz'],right:0});
		var comment_img = $.UI.create("ImageView",{image:"/images/comment.png"});
		var comment_button = $.UI.create("Label",{classes:['wsize','hsize','h6'],color:"#90949C",text:"Comment"});
		container.add(title_container);
		container.add(description);
		if(imgArr.length != 0){
			var image_container = $.UI.create("ScrollableView",{classes:['wfill','padding'],height:250,backgroundColor:"#000",top:"0",scrollingEnabled:true});
			imgArr.forEach(function(entry1){
				console.log(entry.img_path);
				var small_image_container = $.UI.create("View",{classes:['wfill','hsize']});
				var image = $.UI.create("ImageView",{classes:['wfill','hsize'],image:entry1.img_path});		
				small_image_container.add(image);		
				image_container.addView(small_image_container);							
			});	
			container.add(image_container);
		}
		container.add(hr);
		container.add(comment_container);
		comment_container.add(comment_count);
		comment_container.add(comment_button_container);
		comment_button_container.add(comment_img);
		comment_button_container.add(comment_button);
		title_container.add(user_img);
		title_child_container.add(username);
		title_child_container.add(time);
		more_container.add(more);
		title_child_container.add(more_container);
		title_container.add(title_child_container);
		$.mother_view.add(container);
		description.addEventListener("click",function(e){
			addPage("post_detail","Post Detail",{p_id:e.source.p_id});
		});
		more_container.addEventListener("click",function(e){
 			postOptions({u_id:e.source.u_id,p_id:e.source.p_id,post_index:e.source.post_index});
		});
		user_img.addEventListener("click",function(e){
			addPage("my_profile","My Profile",{u_id:e.source.u_id});
		});
		comment_button_container.addEventListener("click",function(e){
			addPage("post_comment","Post Comment");
		});	
		post_index++;	
	});
	Alloy.Globals.loading.stopLoading();
}
function refresh(e){
	if(buttonsExpanded){
		clickButtons();
	}
	var firename = e.refreshName || null;
	Alloy.Globals.loading.startLoading("Refreshing...");	
	$.mother_view.removeAllChildren();	
	var checker = Alloy.createCollection('updateChecker'); 
	var isUpdate = checker.getCheckerById("2");
	API.callByPost({url:"getPostList",params:{last_updated: isUpdate.updated}},{
		onload:function(responseText){
			var res = JSON.parse(responseText);
			var arr = res.data || null;
			var model = Alloy.createCollection("post");
			model.saveArray(arr);
			if(res.images != undefined){
				i_model.saveArray(res.images);	
			}			
			model = null;
			arr = null;
			res =null;	
			if(firename != null){
				Ti.App.fireEvent(firename);
			}
			init();				
			Alloy.Globals.loading.stopLoading();			
		}
	});	
}
function postOptions(params){
	var u_id = Ti.App.Properties.getString("u_id")||"";
	var options = (u_id == params.u_id)?['Edit','Delete','Cancel']:['Favourite','Report','Cancel'];
	var checking = (u_id == params.u_id)?true:false;
	var opts = {cancel: 2,options:options,destructive: 0,title: 'More options'};	
	var dialog = Ti.UI.createOptionDialog(opts);	
	dialog.addEventListener("click",function(e){
		if(checking&&e.index == 0){
			addPage("post","Edit Post",{p_id: params.p_id,edit:true});
		}
		if(checking&&e.index == 1){
			deletePost(params.p_id,params.post_index);
		}
	});	
	dialog.show();
}
function deletePost(p_id,p_index){
	COMMON.createAlert("Warning","Are you sure want to delete this post?",function(e){
		Alloy.Globals.loading.startLoading("Posting");		
		API.callByPost({url:"deletePost",params:{id:p_id,status:2}},{
			onload:function(responceText){
				var res = JSON.parse(responceText);
				if(res.status != "success"){
					Alloy.Globals.loading.stopLoading();							
					alert("Something wrong right now please try again later.");
				}else{
					refresh({});			
					Alloy.Globals.loading.stopLoading();		
					alert("Success to delete post.");
				}
			}
		});
	});
}
function addPostView(){
	var container = $.UI.create("View",{classes:['horz','wfill','hsize','padding'],left:"0",right:"0",backgroundColor:"#fff"});
	var	image = $.UI.create("ImageView",{classes:['padding'],width:"45",height:"45",image:"/images/asp_square_logo.png"});
	var title = $.UI.create("Label",{classes:['hsize','h4'], width:"auto",text:"Posting something..."});
	container.add(image);
	container.add(title);
	$.mother_view.add(container);
	container.addEventListener("click",function(){
		addPage("post", "Post");		
	});
	getData();	
}
function clickButtons(){
	var size;
	if(buttonsExpanded){
		size = 60;
		$.bounceView.height = 0;
	}else{
		size = 175;
		$.bounceView.height = Ti.UI.FILL;
	}
	buttonsExpanded = !buttonsExpanded;
	$.buttonsView.resize(size,size);
}
Ti.App.addEventListener("discussion:refresh",refresh);
function doLogout(){
	Alloy.Globals.loading.startLoading("Logout...");	
	Ti.App.Properties.removeAllProperties();
	setTimeout(function(e){
		Ti.App.fireEvent('index:login');
		Alloy.Globals.loading.stopLoading();		
	},2000);
}
function parseDate(str) {
    var mdy = str.split('-');
    return new Date(mdy[0], mdy[1]-1, mdy[2]);
}

function daydiff(first, second) {
    return Math.round((second-first)/(1000*60*60*24));
}

function parseToSecond(hh,mm,ss) {
	return (Math.floor(hh)*60+Math.floor(mm))*60+Math.floor(ss);
}

function getTimePost(p){
	var toTime = new Date();
	var dd = toTime.getDate();
	var mm = toTime.getMonth()+1; //January is 0!
	var yyyy = toTime.getFullYear();
	if(dd<10) {
	    dd='0'+dd;
	} 
	if(mm<10) {
	    mm='0'+mm;
	} 
	var today = yyyy+'-'+mm+'-'+dd;
	var hh = toTime.getHours();
	var mi = +toTime.getMinutes();
	var ss = toTime.getSeconds();
	if(hh<10) {
	    hh='0'+hh;
	} 
	if(mi<10) {
	    mi='0'+mi;
	}
	if(ss<10) {
		ss='0'+ss;
	}
	var nowTime = hh+":"+mi+":"+ss;
	var postYear = Math.floor(p.substring(0,4));
	var postMonth = Math.floor(p.substring(5,7));
	var postDate = Math.floor(p.substring(8,10));
	if(postDate<10) {
	    postDate='0'+postDate;
	} 
	if(postMonth<10) {
	    postMonth='0'+postMonth;
	}
	var postCreatedDate = postYear+"-"+postMonth+"-"+postDate;
	console.log(p);
	var postHour = Math.floor(p.substring(11,13));
	var postMinute = Math.floor(p.substring(14,16));
	var postSecond = Math.floor(p.substring(17,19));
	if (postHour<10) {
		postHour='0'+postHour;
	}
	if (postMinute<10) {
		postMinute='0'+postMinute;
	}
	if (postSecond<10) {
		postSecond='0'+postSecond;	
	}
	var postTime = +postHour+":"+postMinute+":"+postSecond;
	var postSecond = parseToSecond(postHour,postMinute,postSecond);
	var nowSecond = parseToSecond(hh,mi,ss);
	var minusSecond = postSecond-nowSecond;
	var hourDisplay = minusSecond/60/60;
	var dayOfDistance = daydiff(parseDate(today), parseDate(postCreatedDate));
	if (dayOfDistance==-1) {
		return ("Yesterday"+"  "+postHour+":"+postMinute);
	}else if (dayOfDistance==0) {
		if (minusSecond<900) {
			return ("Just now");	
		}else if (minusSecond<3600) {
			return (minutesDisplay.toFixed(0)+" mins");
		}else{
			var hr = (minusSecond<7200)?" hr":" hrs";
			return (hourDisplay.toFixed(0)+hr);
		}
	}else if (dayOfDistance<-1) {
		return (postCreatedDate+"  "+postHour+":"+postMinute);
	}
}

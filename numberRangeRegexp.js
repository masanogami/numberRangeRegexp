//numberRangeRegexp.js
//version 1.1.4
//update 2020.1.30
//by Nogami Masahiko


//繰り返し文字列の作成
String.prototype.repeat = function(num) {
	for (var str = ""; (this.length * num) > str.length; str += this);
	return str;
};

//全角から半角へ変換
function toHalfWidth(strVal){
  // 半角変換
  var halfVal = strVal.replace(/[\uff08-\uff5e]/g,
    function( tmpStr ) {
      // 文字コードをシフト
      return String.fromCharCode( tmpStr.charCodeAt(0) - 0xFEE0 );
    }
  );
  // 文字コードシフトで対応できない文字の変換
  return halfVal
  	.replace(/＋/g, "+")
    .replace(/ー/g, "-")
    .replace(/−/g, "-")
    .replace(/×/g, "*")
    .replace(/÷/g, "/")
    .replace(/　/g, " ")
    ;
}

//正規表現パーツ文字の生成
function makeBrackets(str1, str2){//str1とstr2の範囲を生成
	if( str1 == str2 ){
		return str1;
	}else{
		return '[' + str1 + '-' + str2 + ']';
	}
}
function makeBraces(str1, str2){//繰り返しを生成
	if(arguments.length < 2 || str1 == str2){
		if (parseInt(str1) == 1){
			return '';
		}else{
			return '{' + str1 + '}';
		}
	}else{
		return '{' + str1 + ',' + str2 + '}';
	}
}

function addMinus(str){//マイナス記号を追加
                return '-(' + str + ')';
}

function addDecimal(str){//小数点以下を追加（あってもなくてもマッチ）
	return '(' + str + ')(\\.[0-9]+)?';
}

function addClip(str){//前後を数字以外で囲う
	return '(?<=[^0-9\.]|^)(' + str + ')(?=[^0-9\.]|$)';
}


//数値範囲の正規表現を生成
function numberRangeRegexp(start, end, withDecimal){//前処理部
	if(arguments.length < 3){//引数が２つ以下の場合
		withDecimal = false;
	}
	if(start === '' && end === ''){//どちらも空の場合、終了
		return '';
	}else if(start === '' || end === ''){//どちらかの値が空の場合、同じ値を入れる
		if(start === '') start = end;
		if(end === '') end = start;
	}
	
	var start_value = parseInt(start);
	var end_value = parseInt(end);

	if(start_value == end_value){//start = end の場合
		return String(start_value);
	}
	
	var isMinus = false;
	
	if( start_value < 0 && end_value < 0){//どちらもマイナス値の場合
		isMinus = true;
		start_value = -start_value;
		end_value = -end_value;
	}
	
	if(start_value > end_value){//start > end の場合、値を入れ替える
		var temp = start_value;
		start_value = end_value;
		end_value = temp;
	}
	
	var ex;

	if(start_value < 0 && end_value >= 0){//startのみマイナス値の場合
		if(withDecimal){//小数点付きもマッチングさせる場合
			if(start_value == -1){//startが-1の場合
    			ex = String(start_value) + '|' + addDecimal('-0') + '|';
            }else{
                ex = String(start_value) + '|' + addDecimal(addMinus(makeNumberRangeRegexp(0, -start_value - 1))) + '|';
            }
            if(end_value == 0){//endが0の場合
                ex = ex + '0';
            }else if(end_value == 1){//endが1の場合
                ex = ex + addDecimal('0') + '|' + String(end_value);
            }else{
                ex = ex + addDecimal(makeNumberRangeRegexp(0, end_value - 1)) + '|' + String(end_value);
            }
		}else{
			if(start_value == -1){//startが-1の場合
    			ex = String(start_value) + '|';
            }else{
                ex = addMinus(makeNumberRangeRegexp(1, -start_value)) + '|';
            }
            if(end_value == 0){//endが0の場合
                ex = ex + '0';
            }else{
                ex = ex + makeNumberRangeRegexp(0, end_value);;
            }
		}
	}else{
		if(withDecimal){
			ex = addDecimal(makeNumberRangeRegexp(0, end_value - 1)) + '|' + String(end_value);
		}else{
			ex = makeNumberRangeRegexp(start_value, end_value);
		}
		if(isMinus) ex = addMinus(ex);
	}
	return ex;
}	

	
function makeNumberRangeRegexp(start_value, end_value){//正規表現生成部 start_value < end_valueであること

	var start_str = String(start_value);//startの文字列
	var end_str = String(end_value);//endの文字列
	var start_digit = start_str.length;//startの桁数
	var end_digit = end_str.length;//endの桁数
	var agree_digit = 0;//startとendの同数字の桁数
	
	if(start_digit == end_digit){//start,endの桁数が同じ場合
		for(var i = start_digit; i > 0; i--){//違いがある桁数を求める
			if(start_str.substr(0, i) == end_str.substr(0, i)){
				agree_digit = i;
				break;
			}
		}
		if(start_digit - agree_digit == 1){//start,endの違いが下1桁目だけの場合
			var ex = '';
			if(start_digit > 1){
				ex = start_str.substr(0, start_digit - 1);
			}
			ex = ex + makeBrackets(start_str.charAt(start_digit - 1),end_str.charAt(start_digit - 1));
			return ex;
		}
	}
//	window.console.log('agree_digit:' + agree_digit);

	var lower_thre;//下位領域のしきい値
	var upper_thre;//上位領域のしきい値

	var exL = ""; //下位領域
	if(start_str.match(/^[1-9]0+$/)){//startがx000...の場合
		lower_thre = start_str;
	}else if(start_str.match(/^[1-9]9+$/)){//startがx999...の場合
		exL = start_str + '|';
		lower_thre = String(parseInt(start_str.charAt(0)) + 1) + '0'.repeat(start_digit - 1);
	}else{
		if(start_digit == 1){
			exL = makeBrackets(start_str,9) + '|'; //startが１桁の場合
			lower_thre = String('10');
		}else{
			for(var i = 2; i < start_digit - agree_digit; i++){
				if(parseInt(start_str.charAt(start_digit - i)) != 9){
					if(parseInt(start_str.substr(0, start_digit - i) + '9'.repeat(i)) <= end_value){
						exL = exL + start_str.substr(0, start_digit - i) + makeBrackets(parseInt(start_str.charAt(start_digit - i)) + 1,9) ;
						if(i-1 > 0){
							exL = exL + '[0-9]' + makeBraces(i-1) ;
						}  
						exL = exL + '|';
					}
				}
			}
			exL = start_str.substr(0, start_digit - 1) + makeBrackets(start_str.charAt(start_digit - 1), 9) + '|' + exL;
			lower_thre = String(parseInt(start_str.substr(0,agree_digit+1)) + 1) + '0'.repeat(start_digit - agree_digit - 1);

		}
	}
//	window.console.log('lower_thre:' + lower_thre);

	var exU = ''; //上位領域
	if(end_str.match(/^[1-9]9+$/)){//endがx999...の場合
		upper_thre = end_str;
	}else if(end_str.match(/^[1-9]0+$/)){//endがx000...の場合
		exU = end_str;
		upper_thre = String(parseInt(end_str.substr(0,2))-1) + '9'.repeat(end_digit - 2);
	}else{
		for(var i = 2; i < end_digit - agree_digit ; i++){
			if(parseInt(end_str.charAt(end_digit - i)) != 0){
				exU = end_str.substr(0, end_digit - i) + makeBrackets(0, parseInt(end_str.charAt(end_digit - i)) - 1) + '[0-9]' + makeBraces(i-1) + '|' + exU;
			}
		}
		exU = exU + end_str.substr(0, end_digit - 1) + makeBrackets(0, end_str.charAt(end_digit - 1)) + '|';
		upper_thre = String(parseInt(String(parseInt(end_str.substr(0,agree_digit+1)) - 1) + '9'.repeat(end_digit - agree_digit - 1)));
	}
//	window.console.log('upper_thre:' + upper_thre);

	var exM = ""; //中位領域

	if(parseInt(lower_thre) < parseInt(upper_thre)){
		var lower_digit = lower_thre.length;
		var upper_digit = upper_thre.length;
		
		if(lower_digit == upper_digit){
			exM = lower_thre.substr(0, agree_digit) + makeBrackets(lower_thre.charAt(agree_digit), upper_thre.charAt(agree_digit)) + '[0-9]' + makeBraces(lower_digit  - agree_digit -1) + '|';
		}else{
			if(lower_thre.charAt(0) == '1'){
				if(upper_thre.charAt(0) == '9'){
					exM = makeBrackets(1,9) + makeBrackets(0,9) + makeBraces(lower_digit - 1, upper_digit - 1) + '|';
				}else{
					exM = makeBrackets(1,9) + makeBrackets(0,9) + makeBraces(lower_digit - 1, upper_digit - 2) + '|';
					exM = exM + makeBrackets(1,upper_thre.charAt(0)) + makeBrackets(0,9) + makeBraces(upper_digit - 1) + '|';
				}
			}else{
				if(upper_thre.charAt(0) == '9'){
					exM = makeBrackets(lower_thre.charAt(0),9) + makeBrackets(0,9) + makeBraces(lower_digit - 1) + '|';
					exM = exM + makeBrackets(1,9) + makeBrackets(0,9) + makeBraces(lower_digit, upper_digit - 1) + '|';
				}else{
					exM = makeBrackets(lower_thre.charAt(0),9) + makeBrackets(0,9) + makeBraces(lower_digit - 1) + '|';
					if(upper_digit - lower_digit > 1){
						exM = exM + makeBrackets(1,9) + makeBrackets(0,9) + makeBraces(lower_digit, upper_digit - 2) + '|';
					}
					exM = exM + makeBrackets(1,upper_thre.charAt(0)) + makeBrackets(0,9) + makeBraces(upper_digit - 1) + '|';
				}
			}
		}
	}

//	window.console.log('下位:'+exL);
//	window.console.log('中位:'+exM);
//	window.console.log('上位:'+exU);

	var ex = exL+exM+exU;
	if(ex.charAt(ex.length - 1) == '|') ex = ex.substr(0, ex.length - 1);
	return ex;
}

import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:async';
import 'dart:convert';

void main() => runApp(MyApp());

class Post {
  final int userId;
  final int id;
  final String title;
  final String body;

  Post({this.userId, this.id, this.title, this.body});

  factory Post.fromJson(Map<String, dynamic> json) {
    return Post(
      userId: json['userId'],
      id: json['id'],
      title: json['title'],
      body: json['body'],
    );
  }
}

class MyApp extends StatelessWidget {
  // This widget is the root of your application.
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Microenergy App (CES2019)',
      theme: ThemeData(
        // This is the theme of your application.
        //
        // Try running your application with "flutter run". You'll see the
        // application has a blue toolbar. Then, without quitting the app, try
        // changing the primarySwatch below to Colors.green and then invoke
        // "hot reload" (press "r" in the console where you ran "flutter run",
        // or simply save your changes to "hot reload" in a Flutter IDE).
        // Notice that the counter didn't reset back to zero; the application
        // is not restarted.
        primarySwatch: Colors.blue,
      ),
      home: MyHomePage(title: 'Microenergy App (CES2019)'),
    );
  }
}

class MyHomePage extends StatefulWidget {
  MyHomePage({Key key, this.title}) : super(key: key);

  // This widget is the home page of your application. It is stateful, meaning
  // that it has a State object (defined below) that contains fields that affect
  // how it looks.

  // This class is the configuration for the state. It holds the values (in this
  // case the title) provided by the parent (in this case the App widget) and
  // used by the build method of the State. Fields in a Widget subclass are
  // always marked "final".

  final String title;

  @override
  _MyHomePageState createState() => _MyHomePageState();
}

class _MyHomePageState extends State<MyHomePage> {
  static final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();
  int _counter = 0;
  var _mep_ms = 0;
  var _clicks = 0;
  void _incrementCounter() {
    setState(() {
      // This call to setState tells the Flutter framework that something has
      // changed in this State, which causes it to rerun the build method below
      // so that the display can reflect the updated values. If we changed
      // _counter without calling setState(), then the build method would not be
      // called again, and so nothing would appear to happen.
      _counter++;
      _clicks++;
      _mep_ms = (_counter*10000);
    });
  }

  Future<http.Response> fetchPost() async {
    print('fetchPost()');
    // XXX Hardcoded URL
    final response = await http.post('https://ky2pd7dln4.execute-api.us-west-2.amazonaws.com/latest/use', body: {"units": '$_counter', "id": '$_clicks'});
    if (response.statusCode == 200) {
      print('Success posting microenergy data');

      _scaffoldKey.currentState.showSnackBar(SnackBar(
        content: Text('Successfully sent $_mep_ms ms of Microenergy.  '),
        action: SnackBarAction(
            label: 'View Blockchain',
            onPressed: () {
              _scaffoldKey.currentState.showSnackBar(SnackBar(
                  content: Text('TODO: Implement blockchain viewer')
              ));
            }
        ),
      ));
      _resetCounter();
      // return json.decode(response.body);
    } else {
      print('Error posting data, reason: $response.statusCode');
      _scaffoldKey.currentState.showSnackBar(SnackBar(
        content: Text('Failed to send Microenergy.  Reason, HTTP Response: $response.statusCode'),
      ));
    }
  }

  void _resetCounter() {
    setState(() {
      _counter = 0;
      _mep_ms = (_counter*10000);
    });
  }

  @override
  Widget build(BuildContext context) {
    // This method is rerun every time setState is called, for instance as done
    // by the _incrementCounter method above.
    //
    // The Flutter framework has been optimized to make rerunning build methods
    // fast, so that you can just rebuild anything that needs updating rather
    // than having to individually change instances of widgets.
    return Scaffold(
      key: _scaffoldKey,
      appBar: AppBar(
        // Here we take the value from the MyHomePage object that was created by
        // the App.build method, and use it to set our appbar title.
        title: Text(widget.title),
      ),
      body: Center(
        // Center is a layout widget. It takes a single child and positions it
        // in the middle of the parent.
        child: Column(
          // Column is also layout widget. It takes a list of children and
          // arranges them vertically. By default, it sizes itself to fit its
          // children horizontally, and tries to be as tall as its parent.
          //
          // Invoke "debug painting" (press "p" in the console, choose the
          // "Toggle Debug Paint" action from the Flutter Inspector in Android
          // Studio, or the "Toggle Debug Paint" command in Visual Studio Code)
          // to see the wireframe for each widget.
          //
          // Column has various properties to control how it sizes itself and
          // how it positions its children. Here we use mainAxisAlignment to
          // center the children vertically; the main axis here is the vertical
          // axis because Columns are vertical (the cross axis would be
          // horizontal).
          mainAxisAlignment: MainAxisAlignment.center,
          children: <Widget>[
            Text(
              'Microenergy Units:',
            ),
            Text(
              '$_counter',
              style: Theme.of(context).textTheme.display1,
            ),Text(
              'Microenergy ms To Use:',
            ),Text(
              '$_mep_ms' + "ms",
              style: Theme.of(context).textTheme.display1,
            ),
            OutlineButton(
              child: const Text('Send'),
              onPressed: () {
                fetchPost();
                /*
                _scaffoldKey.currentState.showSnackBar(const SnackBar(
                    content: Text("Editing isn't supported in this screen.")
                ));
                */
                // return CircularProgressIndicator();
                /*
                Future<http.Response> fetchPost() {
                  return http.get('https://jsonplaceholder.typicode.com/posts/1');
                }
                */

                /*
                Future<Post> fetchPost() async {
                  final response =
                  await http.get('https://jsonplaceholder.typicode.com/posts/1');

                  if (response.statusCode == 200) {
                    // If server returns an OK response, parse the JSON
                    return Post.fromJson(json.decode(response.body));
                  } else {
                    // If that response was not OK, throw an error.
                    throw Exception('Failed to load post');
                  }
                }
                */

                // Navigator.pop(context, true);
              },
            )
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _incrementCounter,
        tooltip: 'Increment',
        child: Icon(Icons.add),
      ), // This trailing comma makes auto-formatting nicer for build methods.
    );
  }
}

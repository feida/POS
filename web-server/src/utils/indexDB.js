const restoDB = {
  name: 'restoDB',
  version: 1,
  db: null
}
const request = null;

const connectDB = (name, version) => window.indexedDB.open(name, version);

const openDB = request => request.onsuccess = e => restoDB.db = e.target.result;

const onupgradeneededDB = e => {
  restoDB.db = e.target.result;
  if (!restoDB.db.objectStoreNames.contains('students')) {
    restoDB.db.createObjectStore('students', {keyPath: 'id'});
    console.log(`DB version changed to + ${restoDB.version}`)
  };
}

const closeDB = (db) => setTimeout( ()=>db.close(), 500); // 关闭数据库

const deleteDB = (name) => indexedDB.deleteDatabase(name); // 删除数据库

const addDB = (db, storeName) => {
  var transaction = db.transaction(storeName, 'readwrite');
  var store = transaction.objectStore(storeName);
  for (var i = 0; i < students.length; i++) {
    store.add(students[i]);
  }
}

const students=[{
          id:1001,
          name:"Byron",
          age:24
        },{
          id:1002,
          name:"Frank",
          age:30
        },{
          id:1003,
          name:"Aaron",
          age:26
        }];

connectDB(restoDB.name, restoDB.version);
openDB(request)
// setTimeout(()=>{
//   addDB(restoDB.db, students)
// })

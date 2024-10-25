const readline = require('readline');
const mysql = require('mysql');

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'USERS'
});

connection.connect((err) => {
  if (err) {
    console.error('Error connecting to database: ' + err.stack);
    return;
  }
  console.log('Connected to database as id ' + connection.threadId);
  startCLI();
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function startCLI() {
  rl.question('Enter a command (createUser, retrieveUsers, updateUser, deleteUser): ', (command) => {
    if (command === 'createUser') {
      // Ask for user info separated by commas and call createUser function
      rl.question('Enter user info separated by commas (title, firstName, surname, mobile, email, homeAddressLine1, homeAddressLine2, homeTown, homeCountyCity, homeEircode, shippingAddressLine1, shippingAddressLine2, shippingTown, shippingCountyCity, shippingEircode): ', (userInfo) => {
        createUser(userInfo.split(',').map(item => item.trim()));
        rl.close();
      });
    } else if (command === 'retrieveUsers') {
      // Ask for user's name and call retrieveUsers function
      rl.question('Enter name: ', (name) => {
        retrieveUsers(name);
        rl.close();
      });
    } else if (command === 'updateUser') {
      // Ask for user ID and updated user info separated by commas and call updateUser function
      rl.question('Enter user ID: ', (userId) => {
        rl.question('Enter updated user info separated by commas (mobile, email, title, homeAddressLine1, homeAddressLine2, homeTown, homeCountyCity, homeEircode, shippingAddressLine1, shippingAddressLine2, shippingTown, shippingCountyCity, shippingEircode): ', (userInfo) => {
          updateUser(userId, ...userInfo.split(',').map(item => item.trim()));
          rl.close();
        });
      });
    } else if (command === 'deleteUser') {
      // Ask for user email, mobile, and name and call deleteUser function
      rl.question('Enter user email: ', (email) => {
        rl.question('Enter user mobile: ', (mobile) => {
          rl.question('Enter user name (first name or surname): ', (name) => {
            deleteUser(email, mobile, name);
            rl.close();
          });
        });
      });
    } else {
      console.log('Invalid command.');
      rl.close();
    }
  });
}

function createUser(userInfo) {
  // Unpack user info
  const [title, firstName, surname, mobile, email, homeAddressLine1, homeAddressLine2, homeTown, homeCountyCity, homeEircode, shippingAddressLine1, shippingAddressLine2, shippingTown, shippingCountyCity, shippingEircode] = userInfo;
  // SQL statements for inserting user data into personal_info, home_address, and shipping_address tables
  const personalInfoSql = 'INSERT INTO personal_info (Title, First_Name, Surname, Mobile, Email_Address) VALUES (?, ?, ?, ?, ?)';
  const homeAddressSql = 'INSERT INTO home_address (Address_Line1, Address_Line2, Town, County_City, Eircode) VALUES (?, ?, ?, ?, ?)';
  const shippingAddressSql = 'INSERT INTO shipping_address (Address_Line1, Address_Line2, Town, County_City, Eircode) VALUES (?, ?, ?, ?, ?)';

  // Begin transaction to ensure atomicity
  connection.beginTransaction((err) => {
    if (err) { throw err; }
    // Insert personal info
    connection.query(personalInfoSql, [title, firstName, surname, mobile, email], (error, results, fields) => {
      if (error) {
        return connection.rollback(() => {
          throw error;
        });
      }

      const userId = results.insertId;

      // Insert home address
      connection.query(homeAddressSql, [homeAddressLine1, homeAddressLine2, homeTown, homeCountyCity, homeEircode], (error, results, fields) => {
        if (error) {
          return connection.rollback(() => {
            throw error;
          });
        }

        // Insert shipping address
        connection.query(shippingAddressSql, [shippingAddressLine1, shippingAddressLine2, shippingTown, shippingCountyCity, shippingEircode], (error, results, fields) => {
          if (error) {
            return connection.rollback(() => {
              throw error;
            });
          }

          // Commit transaction
          connection.commit((err) => {
            if (err) {
              return connection.rollback(() => {
                throw err;
              });
            }
            console.log('Transaction Complete.');
          });
        });
      });
    });
  });
}

function retrieveUsers(name) {
  // SQL query to retrieve users based on name
  const sql = 'SELECT pi.*, ha.*, sa.* FROM personal_info pi LEFT JOIN home_address ha ON pi.id = ha.ID LEFT JOIN shipping_address sa ON pi.id = sa.ID WHERE pi.First_Name LIKE ? OR pi.Surname LIKE ?';
  name = '%' + name + '%';

  // Execute query
  connection.query(sql, [name, name], (error, results, fields) => {
    if (error) { throw error; }
    console.log('Retrieved Users:', results);
  });
}

function updateUser(userId, phone, email, title, homeAddressLine1, homeAddressLine2, homeTown, homeCountyCity, homeEircode, shippingAddressLine1, shippingAddressLine2, shippingTown, shippingCountyCity, shippingEircode) {
  // SQL statements for updating user's personal info, home address, and shipping address
  const personalInfoSql = 'UPDATE personal_info SET Mobile = ?, Email_Address = ?, Title = ? WHERE id = ?';
  const homeAddressSql = 'UPDATE home_address SET Address_Line1 = ?, Address_Line2 = ?, Town = ?, County_City = ?, Eircode = ? WHERE ID = ?';
  const shippingAddressSql = 'UPDATE shipping_address SET Address_Line1 = ?, Address_Line2 = ?, Town = ?, County_City = ?, Eircode = ? WHERE ID = ?';

  // Begin transaction
  connection.beginTransaction((err) => {
    if (err) { throw err; }
    // Update personal info
    connection.query(personalInfoSql, [phone, email, title, userId], (error, results, fields) => {
      if (error) {
        return connection.rollback(() => {
          throw error;
        });
      }

      // Update home address
      connection.query(homeAddressSql, [homeAddressLine1, homeAddressLine2, homeTown, homeCountyCity, homeEircode, userId], (error, results, fields) => {
        if (error) {
          return connection.rollback(() => {
            throw error;
          });
        }

        // Update shipping address
        connection.query(shippingAddressSql, [shippingAddressLine1, shippingAddressLine2, shippingTown, shippingCountyCity, shippingEircode, userId], (error, results, fields) => {
          if (error) {
            return connection.rollback(() => {
              throw error;
            });
          }

          // Commit transaction
          connection.commit((err) => {
            if (err) {
              return connection.rollback(() => {
                throw err;
              });
            }
            console.log('Transaction Complete.');
          });
        });
      });
    });
  });
}

function deleteUser(email, phone, name) {
  // SQL statement to delete user records based on email, phone, and name
  const deletePersonalInfoSql = 'DELETE FROM personal_info WHERE Email_Address = ? AND Mobile = ? AND (First_Name = ? OR Surname = ?)';

  // Execute delete query for personal_info table
  connection.query(deletePersonalInfoSql, [email, phone, name, name], (error, personalInfoResults, fields) => {
    if (error) { 
      if (error.code === 'ER_ROW_IS_REFERENCED_2') {
        console.log('Cannot delete user. The user may have associated records in the database.');
      } else {
        throw error;
      }
    } else {
      console.log('Deleted Users from personal_info, home_adress, shipping_adress:', personalInfoResults.affectedRows);
    }
  });
}



// I fisrt tested the code to see if the functions work using these commands straitght in the code and then running it
// createUser(["Mr", "John", "Doe", "123456789", "john.doe@example.com", "123 Main St", "", "Springfield", "County", "12345", "456 Elm St", "", "Springfield", "County", "12345"]);
// retrieveUsers("John");
// updateUser(1, "987654321", "new.email@example.com", "Dr", "456 Elm St", "Optional", "Springfield", "County", "54321", "456 Elm St", "", "Springfield", "County", "54321");
// deleteUser("new.email@example.com", "987654321", "John");
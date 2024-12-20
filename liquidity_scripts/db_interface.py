import psycopg2
from psycopg2.extras import execute_values


class DatabaseInterface:
    def __init__(self, host, database, user, password):
        """
        Initialize the database connection.
        """
        self.conn = psycopg2.connect(
            host=host,
            database=database,
            user=user,
            password=password
        )
        self.cursor = self.conn.cursor()

    def add(self, table, data):
        """
        Add a record to a table.
        Skips duplicates using ON CONFLICT DO NOTHING.
        :param table: Name of the table
        :param data: Dictionary of column names and values
        """
        columns = ', '.join(data.keys())
        values = ', '.join(['%s'] * len(data))
        query = f"INSERT INTO {table} ({columns}) VALUES ({values}) ON CONFLICT DO NOTHING"
        try:
            self.cursor.execute(query, tuple(data.values()))
            self.conn.commit()
            print(f"Record added to {table}: {data}")
        except psycopg2.Error as e:
            print(f"Error adding record to {table}: {e}")
            self.conn.rollback()

    def add_bulk(self, table, data_list):
        """
        Bulk add records to a table.
        Skips duplicates using ON CONFLICT DO NOTHING.
        :param table: Name of the table
        :param data_list: List of dictionaries with column names and values
        """
        if not data_list:
            return
        columns = ', '.join(data_list[0].keys())
        values = ', '.join(['%s'] * len(data_list[0]))
        query = f"INSERT INTO {table} ({columns}) VALUES ({values}) ON CONFLICT DO NOTHING"
        try:
            execute_values(self.cursor, query, [tuple(data.values()) for data in data_list])
            self.conn.commit()
            print(f"{len(data_list)} records added to {table}")
        except psycopg2.Error as e:
            print(f"Error adding bulk records to {table}: {e}")
            self.conn.rollback()

    def delete(self, table, condition):
        """
        Delete a record from a table.
        :param table: Name of the table
        :param condition: WHERE clause condition (e.g., "id = 1")
        """
        query = f"DELETE FROM {table} WHERE {condition}"
        try:
            self.cursor.execute(query)
            self.conn.commit()
            print(f"Record deleted from {table} where {condition}")
        except psycopg2.Error as e:
            print(f"Error deleting record from {table}: {e}")
            self.conn.rollback()

    def update(self, table, updates, condition):
        """
        Update a record in a table.
        :param table: Name of the table
        :param updates: Dictionary of columns and their new values
        :param condition: WHERE clause condition (e.g., "id = 1")
        """
        update_clause = ', '.join([f"{key} = %s" for key in updates.keys()])
        query = f"UPDATE {table} SET {update_clause} WHERE {condition}"
        try:
            self.cursor.execute(query, tuple(updates.values()))
            self.conn.commit()
            print(f"Record updated in {table}: {updates} where {condition}")
        except psycopg2.Error as e:
            print(f"Error updating record in {table}: {e}")
            self.conn.rollback()

    def query(self, table, condition=None):
        """
        Query records from a table.
        :param table: Name of the table
        :param condition: WHERE clause condition (optional)
        """
        query = f"SELECT * FROM {table}"
        if condition:
            query += f" WHERE {condition}"
        try:
            self.cursor.execute(query)
            rows = self.cursor.fetchall()
            return rows
        except psycopg2.Error as e:
            print(f"Error querying records from {table}: {e}")
            return []

    def close(self):
        """
        Close the database connection.
        """
        try:
            self.cursor.close()
            self.conn.close()
        except psycopg2.Error as e:
            print(f"Error closing the database connection: {e}")
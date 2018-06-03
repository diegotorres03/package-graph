# package-graph
Is a small scrip thar crawl trough your npm dependencies and build a graph structure on Neo4j.



## dependencies
For this application to run is required a [Neo4j](https://neo4j.com/download/) database instance or try the [Neo4j sandbox](https://neo4j.com/lp/try-neo4j-sandbox/).

Once you have your url and credentials set the next environment vaiables:
```sh
export NEO4J_URL='your neo4j url'
export NEO4J_USER='your neo4j user'
export NEO4J_PASSWORD='your neo4j password'
```

## Run the script

```sh
node index.js analyze <path-to-project>
```

When your script finish go to your neo4j database and start querying your graph

### example queries

```cypher
MATCH (dep:Dependency) RETURN count(DISTINCT dep) AS depenencies
```
```cypher
match p=(app:App)-[*..5]->(:Dependency) return p order by length(p) desc limit 10
```
```cypher
match p=(app:App)-->(:Dependency {name: 'webpack' })-[*..4]->(:Dependency) return p order by length(p) desc limit 10
```


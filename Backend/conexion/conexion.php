<?php
class conexion{
    public static function  conectar(){
        $cnn = null;
        try{
            $cnn = new PDO('mysql:host=localhost;dbname=comunidadinteligente',"root","");
            $cnn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

        }catch(PDOexception $ex){
            echo "Errro de conexion:".$ex->getMessage();
        }
         return $cnn;
    }
       
}
$con = conexion::conectar();
?>